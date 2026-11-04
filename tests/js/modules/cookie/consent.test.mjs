import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { installDom, uninstallDom } from '../../helpers/dom.mjs'
import {
    CONFIG_HASH_COOKIE,
    PREFERENCE_COOKIE,
    UPDATE_EVENT,
    checkConfigurationHash,
    isPreferenceSet,
    snapshotState,
    submitConsent,
} from '@views-theme/modules/cookie/consent.js'

const GROUPS_URL = '/cookie/groups'
const LANGUAGE = 'lang-en'
const HASH = 'hash-v2'

/** Shape of core `frontend.cookie.groups` (trimmed to what the module reads). */
function groups({ hash = HASH, languageId = LANGUAGE } = {}) {
    return {
        hash,
        languageId,
        elements: [
            {
                isRequired: true,
                entries: [
                    { cookie: 'session-' },
                    { cookie: 'timezone' },
                    { cookie: PREFERENCE_COOKIE, value: '1', expiration: 30, hidden: true },
                    { cookie: CONFIG_HASH_COOKIE, value: hash, hidden: true },
                ],
            },
            {
                isRequired: false,
                entries: [
                    { cookie: 'youtube-video', value: '1', expiration: 30 },
                    { cookie: 'wishlist-enabled', value: '1', expiration: 30 },
                ],
            },
            // A group that is a cookie itself.
            { isRequired: false, cookie: 'ad-cookie', value: 'yes', expiration: 'invalid' },
        ],
    }
}

/** @returns {Record<string, boolean>} */
function lastUpdate(dom) {
    const updates = dom.published.filter(({ eventName }) => eventName === UPDATE_EVENT)
    assert.ok(updates.length > 0, `${UPDATE_EVENT} was not published`)

    return /** @type {Record<string, boolean>} */ (updates.at(-1).detail)
}

describe('cookie/consent', () => {
    /** @type {ReturnType<typeof installDom>} */
    let dom

    beforeEach(() => {
        dom = installDom()
        dom.respond(groups())
    })

    afterEach(() => {
        uninstallDom()
    })

    describe('submitConsent', () => {
        it('required: sets only technically required cookies and reports every cookie', async () => {
            dom.jar.set('youtube-video', '1')

            assert.equal(await submitConsent(GROUPS_URL, 'required'), true)

            assert.equal(dom.jar.get(PREFERENCE_COOKIE), '1')
            assert.equal(dom.jar.has('youtube-video'), false)
            assert.equal(dom.jar.has('session-'), false, 'server-managed cookies are never written by JS')
            assert.deepEqual(JSON.parse(dom.jar.get(CONFIG_HASH_COOKIE)), { [LANGUAGE]: HASH })

            assert.deepEqual(lastUpdate(dom), {
                'session-': true,
                timezone: true,
                [PREFERENCE_COOKIE]: true,
                [CONFIG_HASH_COOKIE]: true,
                'youtube-video': false,
                'wishlist-enabled': false,
                'ad-cookie': false,
            })
        })

        it('all: sets every cookie with a value', async () => {
            await submitConsent(GROUPS_URL, 'all')

            assert.equal(dom.jar.get('youtube-video'), '1')
            assert.equal(dom.jar.get('wishlist-enabled'), '1')
            assert.equal(dom.jar.get('ad-cookie'), 'yes', 'invalid expiration falls back to the default')
            assert.equal(lastUpdate(dom)['ad-cookie'], true)
        })

        it('selected: enables the selected cookies only; required stay on without being selected', async () => {
            await submitConsent(GROUPS_URL, 'selected', { selected: ['wishlist-enabled'] })

            assert.equal(dom.jar.get('wishlist-enabled'), '1')
            assert.equal(dom.jar.has('youtube-video'), false)
            assert.equal(dom.jar.get(PREFERENCE_COOKIE), '1')
        })

        it('with previous state: reports only the cookies that changed', async () => {
            dom.jar.set('youtube-video', '1')
            const previous = snapshotState([
                { cookie: 'youtube-video', required: false },
                { cookie: 'wishlist-enabled', required: false },
                { cookie: 'ad-cookie', required: false },
            ])

            assert.deepEqual(previous, { active: ['youtube-video'], inactive: ['wishlist-enabled', 'ad-cookie'] })

            await submitConsent(GROUPS_URL, 'selected', { selected: ['wishlist-enabled'], previous })

            assert.deepEqual(lastUpdate(dom), { 'youtube-video': false, 'wishlist-enabled': true })
        })

        it('with an empty previous state: reports every cookie', async () => {
            await submitConsent(GROUPS_URL, 'all', { previous: { active: [], inactive: [] } })

            assert.equal(Object.keys(lastUpdate(dom)).length, 7)
        })

        it('keeps the hashes of other languages', async () => {
            dom.jar.set(CONFIG_HASH_COOKIE, JSON.stringify({ 'lang-de': 'hash-de' }))

            await submitConsent(GROUPS_URL, 'required')

            assert.deepEqual(JSON.parse(dom.jar.get(CONFIG_HASH_COOKIE)), { 'lang-de': 'hash-de', [LANGUAGE]: HASH })
        })

        it('returns false and changes nothing when the groups cannot be loaded', async () => {
            dom.respond(null, false)
            const error = console.error
            console.error = () => {}

            try {
                assert.equal(await submitConsent(GROUPS_URL, 'all'), false)
            } finally {
                console.error = error
            }

            assert.equal(dom.jar.size, 0)
            assert.equal(dom.published.length, 0)
        })

        it('re-runs the consent-gated reCAPTCHA registration', async () => {
            let registered = 0
            let initialized = 0
            window.registerGoogleReCaptchaPlugins = () => registered++
            window.PluginManager = { initializePlugins: () => initialized++ }

            await submitConsent(GROUPS_URL, 'required')

            assert.equal(registered, 1)
            assert.equal(initialized, 1)
        })
    })

    describe('checkConfigurationHash', () => {
        it('without preference and hash: nothing to check, no request', async () => {
            assert.equal(await checkConfigurationHash(GROUPS_URL), null)
            assert.equal(dom.requests.length, 0)
        })

        it('same hash: keeps consent', async () => {
            dom.jar.set(PREFERENCE_COOKIE, '1')
            dom.jar.set('youtube-video', '1')
            dom.jar.set(CONFIG_HASH_COOKIE, JSON.stringify({ [LANGUAGE]: HASH }))

            assert.equal(await checkConfigurationHash(GROUPS_URL), null)
            assert.equal(isPreferenceSet(), true)
            assert.equal(dom.jar.get('youtube-video'), '1')
            assert.equal(dom.published.length, 0)
        })

        it('changed hash: resets to required, drops the preference and reports the reset', async () => {
            dom.jar.set(PREFERENCE_COOKIE, '1')
            dom.jar.set('youtube-video', '1')
            dom.jar.set(CONFIG_HASH_COOKIE, JSON.stringify({ [LANGUAGE]: 'hash-v1' }))

            assert.equal(await checkConfigurationHash(GROUPS_URL), 'reset')

            assert.equal(isPreferenceSet(), false)
            assert.equal(dom.jar.has('youtube-video'), false)
            assert.deepEqual(JSON.parse(dom.jar.get(CONFIG_HASH_COOKIE)), { [LANGUAGE]: HASH })

            const update = lastUpdate(dom)
            assert.equal(update['youtube-video'], false)
            assert.equal(PREFERENCE_COOKIE in update, false, 'preference is not reported as active after a reset')
        })

        it('consent for another language only: asks again but keeps the shared consent (core parity)', async () => {
            dom.jar.set(PREFERENCE_COOKIE, '1')
            dom.jar.set('youtube-video', '1')
            dom.jar.set(CONFIG_HASH_COOKIE, JSON.stringify({ 'lang-de': 'hash-de' }))

            assert.equal(await checkConfigurationHash(GROUPS_URL), 'language')

            assert.equal(isPreferenceSet(), true)
            assert.equal(dom.jar.get('youtube-video'), '1')
            assert.equal(dom.published.length, 0)
        })

        it('legacy / broken hash cookie counts as no hash for this language', async () => {
            dom.jar.set(PREFERENCE_COOKIE, '1')
            dom.jar.set(CONFIG_HASH_COOKIE, 'not-json')

            assert.equal(await checkConfigurationHash(GROUPS_URL), 'language')
        })

        it('answering for this language clears the language prompt', async () => {
            dom.jar.set(PREFERENCE_COOKIE, '1')
            dom.jar.set(CONFIG_HASH_COOKIE, JSON.stringify({ 'lang-de': 'hash-de' }))

            await submitConsent(GROUPS_URL, 'selected', { selected: [] })

            assert.equal(await checkConfigurationHash(GROUPS_URL), null)
        })
    })
})
