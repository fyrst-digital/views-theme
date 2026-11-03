/**
 * Plain `document.cookie` helpers (parity with core `CookieStorageHelper`).
 *
 * @module @views-theme/modules/cookie/storage
 */

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
    const expires = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
    const secure = window.location.protocol === 'https:' ? ';secure' : ''

    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;sameSite=lax${secure}`
}

/**
 * @param {string} name
 */
export function removeCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}
