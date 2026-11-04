/**
 * Cookie consent domain logic shared by Cookie:Bar and Cookie:Manager: loads the cookie groups,
 * applies a consent mode (cookie set/remove), tracks the per-language config hash and publishes
 * `CookieConfiguration_Update` on `document.$emitter` (the event third-party tracking listens to).
 *
 * Parity with core `CookieConfiguration` (mode semantics, hash reset, update payload).
 *
 * @module @views-theme/modules/cookie/consent
 */

import { fetchJson } from '@views-theme/modules/shared/http.js'
import { getCookie, removeCookie, setCookie } from '@views-theme/modules/cookie/storage.js'

export const PREFERENCE_COOKIE = 'cookie-preference'
export const CONFIG_HASH_COOKIE = 'cookie-config-hash'
export const UPDATE_EVENT = 'CookieConfiguration_Update'
export const CLOSE_EVENT = 'CookieConfiguration_CloseOffCanvas'

const DEFAULT_EXPIRATION = 30

/** Managed server-side; JS never sets them but reports them as active. */
const SERVER_MANAGED = ['session-', 'timezone']

/**
 * @typedef {'required'|'all'|'selected'} ConsentMode
 * @typedef {{ cookie: string, value?: string, expiration?: number|string, isRequired: boolean }} CookieDefinition
 * @typedef {{ active: string[], inactive: string[] }} ConsentState
 */

/**
 * @param {string} url `frontend.cookie.groups`
 * @returns {Promise<{ hash: string, languageId: string, elements: object[] }|null>}
 */
export async function fetchCookieGroups(url) {
    try {
        return /** @type {any} */ (await fetchJson(url))
    } catch (error) {
        console.error('Cookie consent: failed to load cookie groups', error)
        return null
    }
}

/**
 * @returns {boolean}
 */
export function isPreferenceSet() {
    return Boolean(getCookie(PREFERENCE_COOKIE))
}

/**
 * Snapshot of which cookies are currently active, for diffing the next update.
 *
 * @param {{ cookie: string, required: boolean }[]} cookies
 * @returns {ConsentState}
 */
export function snapshotState(cookies) {
    /** @type {ConsentState} */
    const state = { active: [], inactive: [] }

    cookies.forEach(({ cookie, required }) => {
        if (required || getCookie(cookie)) {
            state.active.push(cookie)
        } else {
            state.inactive.push(cookie)
        }
    })

    return state
}

/**
 * Apply a consent mode and publish the update.
 *
 * @param {string} groupsUrl `frontend.cookie.groups`
 * @param {ConsentMode} mode `required` = technically required only, `all`, or `selected`
 * @param {{ selected?: string[], previous?: ConsentState|null }} [options]
 *   `selected`: cookie names to enable (mode `selected`); `previous`: state before the change
 *   (empty = report every cookie as changed)
 * @returns {Promise<boolean>} false when the cookie groups could not be loaded
 */
export async function submitConsent(groupsUrl, mode, { selected = [], previous = null } = {}) {
    const data = await fetchCookieGroups(groupsUrl)
    if (!data) {
        return false
    }

    const { active, inactive } = applyConfiguration(data.elements || [], mode, selected, data.languageId)
    publishUpdate(active, inactive, previous)

    return true
}

/**
 * Drop the stored consent when the cookie configuration changed since the shopper decided.
 *
 * @param {string} groupsUrl `frontend.cookie.groups`
 * @returns {Promise<'reset'|'language'|null>} `reset`: consent cleared (config changed),
 *   `language`: consent given for another language only. Both mean "show the cookie bar".
 */
export async function checkConfigurationHash(groupsUrl) {
    const hasPreference = isPreferenceSet()
    const storedHashData = getCookie(CONFIG_HASH_COOKIE)

    if (!hasPreference && !storedHashData) {
        return null
    }

    const data = await fetchCookieGroups(groupsUrl)
    if (!data) {
        return null
    }

    const storedHash = parseHashes(storedHashData)[data.languageId] || null

    if (storedHash && storedHash !== data.hash) {
        const { active, inactive } = applyConfiguration(data.elements || [], 'required', [], data.languageId)
        removeCookie(PREFERENCE_COOKIE)
        publishUpdate(
            active.filter((name) => name !== PREFERENCE_COOKIE),
            inactive,
            null,
        )

        return 'reset'
    }

    // Consent exists for another language only: keep the shared preference cookie, ask again.
    if (hasPreference && !storedHash) {
        return 'language'
    }

    // Same configuration: extend the hash lifetime.
    if (storedHash) {
        storeHash(data.languageId, data.hash, storedHashData)
    }

    return null
}

/**
 * Set the cookies of the active groups, remove the others.
 *
 * @param {object[]} groups
 * @param {ConsentMode} mode
 * @param {string[]} selected
 * @param {string|null} languageId
 * @returns {{ active: string[], inactive: string[] }}
 */
function applyConfiguration(groups, mode, selected, languageId) {
    const definitions = extractCookies(groups)
    const toSet = []
    const toRemove = []

    definitions.forEach((definition) => {
        const enabled =
            mode === 'all' || definition.isRequired || (mode === 'selected' && selected.includes(definition.cookie))

        if (enabled) {
            toSet.push(definition)
        } else {
            toRemove.push(definition.cookie)
        }
    })

    toRemove.forEach((cookie) => {
        if (getCookie(cookie)) {
            removeCookie(cookie)
        }
    })

    const active = [...SERVER_MANAGED]

    toSet.forEach((definition) => {
        const serverManaged = SERVER_MANAGED.includes(definition.cookie)
        const isHash = definition.cookie === CONFIG_HASH_COOKIE

        if (!serverManaged) {
            active.push(definition.cookie)
        }

        if (!definition.value || serverManaged) {
            return
        }

        if (isHash) {
            if (languageId) {
                storeHash(languageId, String(definition.value))
            }
            return
        }

        setCookie(definition.cookie, String(definition.value), expirationDays(definition.expiration))
    })

    return { active, inactive: toRemove }
}

/**
 * @param {object[]} groups
 * @returns {CookieDefinition[]}
 */
function extractCookies(groups) {
    /** @type {CookieDefinition[]} */
    const cookies = []

    groups.forEach((group) => {
        const isRequired = Boolean(group.isRequired)

        ;(group.entries || []).forEach((entry) => {
            if (entry.cookie) {
                cookies.push({ cookie: entry.cookie, value: entry.value, expiration: entry.expiration, isRequired })
            }
        })

        if (group.cookie) {
            cookies.push({ cookie: group.cookie, value: group.value, expiration: group.expiration, isRequired })
        }
    })

    return cookies
}

/**
 * Only cookies whose state changed against `previous` (every cookie when there is no previous state).
 *
 * @param {string[]} active
 * @param {string[]} inactive
 * @param {ConsentState|null} previous
 */
function publishUpdate(active, inactive, previous) {
    /** @type {Record<string, boolean>} */
    const updated = {}
    const last = previous && (previous.active.length || previous.inactive.length) ? previous : null

    if (!last) {
        active.forEach((cookie) => {
            updated[cookie] = true
        })
        inactive.forEach((cookie) => {
            updated[cookie] = false
        })
    } else {
        active.forEach((cookie) => {
            if (last.inactive.includes(cookie)) {
                updated[cookie] = true
            }
        })
        inactive.forEach((cookie) => {
            if (last.active.includes(cookie)) {
                updated[cookie] = false
            }
        })
    }

    // Consent-gated plugins (reCAPTCHA) register themselves only once the preference is set.
    if (typeof window.registerGoogleReCaptchaPlugins === 'function') {
        window.registerGoogleReCaptchaPlugins()
        window.PluginManager?.initializePlugins()
    }

    document.$emitter?.publish(UPDATE_EVENT, updated)
}

/**
 * @param {number|string|undefined} value
 * @returns {number}
 */
function expirationDays(value) {
    const days = Number(value)

    return Number.isInteger(days) && days > 0 ? days : DEFAULT_EXPIRATION
}

/**
 * Hashes are stored per language so consent is asked once per language.
 *
 * @param {string|null} stored
 * @returns {Record<string, string>}
 */
function parseHashes(stored) {
    if (!stored) {
        return {}
    }

    try {
        const parsed = JSON.parse(stored)

        return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
        return {}
    }
}

/**
 * @param {string} languageId
 * @param {string} hash
 * @param {string|null} [stored]
 */
function storeHash(languageId, hash, stored = getCookie(CONFIG_HASH_COOKIE)) {
    const hashes = parseHashes(stored)
    hashes[languageId] = hash

    setCookie(CONFIG_HASH_COOKIE, JSON.stringify(hashes), DEFAULT_EXPIRATION)
}
