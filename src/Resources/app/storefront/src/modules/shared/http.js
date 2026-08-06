/** XHR helpers for theme component modules. */

/**
 * @param {string} url
 * @param {{ signal?: AbortSignal, headers?: Record<string, string> }} [options]
 * @returns {Promise<string>}
 */
export async function fetchText(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
        signal: options.signal,
    })

    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`)
    }

    return response.text()
}

/**
 * @param {string} url
 * @param {{ signal?: AbortSignal, headers?: Record<string, string> }} [options]
 * @returns {Promise<unknown>}
 */
export async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
        signal: options.signal,
    })

    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`)
    }

    return response.json()
}

/**
 * @param {string} baseUrl
 * @param {Record<string, string>} params
 * @param {Set<string>} [skipKeys]
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
 * @param {{ controller?: AbortController|null, seq?: number }} state
 * @returns {{ controller: AbortController, signal: AbortSignal, id: number, isCurrent: () => boolean }}
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
 * @param {{ controller?: AbortController|null }} state
 */
export function abortRequest(state) {
    if (state.controller) {
        state.controller.abort()
        state.controller = null
    }
}
