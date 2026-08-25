/**
 * XHR helpers for theme component modules.
 *
 * @module @views-theme/modules/shared/http
 */

/**
 * @param {string} url
 * @param {import('@views-theme/modules/types.js').HttpFetchOptions} [options]
 * @returns {Promise<Response>}
 */
export async function fetchResponse(url, options = {}) {
    return fetch(url, {
        method: options.method || 'GET',
        body: options.body,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
        signal: options.signal,
        redirect: options.redirect || 'follow',
    })
}

/**
 * @param {string} url
 * @param {import('@views-theme/modules/types.js').HttpFetchOptions} [options]
 * @returns {Promise<import('@views-theme/modules/types.js').HttpTextResult>}
 */
export async function fetchTextResult(url, options = {}) {
    const response = await fetchResponse(url, options)
    const text = await response.text()

    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`)
    }

    return { status: response.status, text }
}

/**
 * @param {string} url
 * @param {import('@views-theme/modules/types.js').HttpFetchOptions} [options]
 * @returns {Promise<string>}
 */
export async function fetchText(url, options = {}) {
    const result = await fetchTextResult(url, options)

    return result.text
}

/**
 * @param {string} url
 * @param {import('@views-theme/modules/types.js').HttpFetchOptions} [options]
 * @returns {Promise<unknown>}
 */
export async function fetchJson(url, options = {}) {
    const response = await fetchResponse(url, options)

    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`)
    }

    return response.json()
}

/**
 * @param {string} baseUrl
 * @param {Record<string, string>} params
 * @param {Set<string>|null} [skipKeys]
 * @returns {string}
 */
export function urlWithParams(baseUrl, params, skipKeys = null) {
    const target = new URL(baseUrl, window.location.origin)
    Object.entries(params || {}).forEach(([key, value]) => {
        if (skipKeys?.has(key)) {
            return
        }
        target.searchParams.set(key, value)
    })
    return target.toString()
}

/**
 * @param {import('@views-theme/modules/types.js').RequestState} state
 * @returns {import('@views-theme/modules/types.js').BeginRequestResult}
 */
export function beginRequest(state) {
    if (state.controller) {
        state.controller.abort()
    }

    state.seq = (state.seq || 0) + 1
    const id = state.seq
    const controller = new AbortController()
    state.controller = controller

    return {
        controller,
        signal: controller.signal,
        id,
        isCurrent: () => state.seq === id && state.controller === controller,
    }
}

/**
 * @param {import('@views-theme/modules/types.js').RequestState} state
 */
export function abortRequest(state) {
    if (state.controller) {
        state.controller.abort()
        state.controller = null
    }
}
