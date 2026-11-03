/**
 * Plain `document.cookie` helpers (parity with core `CookieStorageHelper`).
 *
 * Names reach these helpers from plugin config and request payloads, so writes refuse anything
 * that is not an RFC 6265 cookie-name token (a `;` would inject cookie attributes).
 *
 * @module @views-theme/modules/cookie/storage
 */

const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/

/**
 * @param {unknown} name
 * @returns {name is string}
 */
export function isValidCookieName(name) {
    return typeof name === 'string' && COOKIE_NAME.test(name)
}

/**
 * @param {string} name
 * @returns {string|null} Cookie value, `null` when the cookie is not set
 */
export function getCookie(name) {
    if (!name) {
        return null
    }

    const prefix = `${name}=`
    const match = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(prefix))

    return match ? match.slice(prefix.length) : null
}

/**
 * @param {string} name
 * @param {string} value
 * @param {number} expirationDays
 */
export function setCookie(name, value, expirationDays) {
    if (!isValidCookieName(name)) {
        console.error('Cookie storage: refusing to write an invalid cookie name', name)
        return
    }

    const expires = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
    const secure = window.location.protocol === 'https:' ? ';secure' : ''

    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;sameSite=lax${secure}`
}

/**
 * @param {string} name
 */
export function removeCookie(name) {
    if (!isValidCookieName(name)) {
        return
    }

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}
