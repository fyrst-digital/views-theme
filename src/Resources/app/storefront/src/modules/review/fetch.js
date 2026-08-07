/**
 * Review list / save XHR.
 *
 * @module @views-theme/modules/review/fetch
 */

import { appendReviewSearchParam } from '@views-theme/modules/review/params.js'
import { abortRequest, beginRequest, fetchText } from '@views-theme/modules/shared/http.js'

/**
 * @param {string} baseUrl
 * @param {Record<string, string|string[]>} params
 * @param {Set<string>|null} [skipKeys]
 * @returns {string}
 */
export function urlWithReviewParams(baseUrl, params, skipKeys = null) {
    const target = new URL(baseUrl, window.location.origin)
    Object.entries(params || {}).forEach(([key, value]) => {
        if (skipKeys?.has(key)) {
            return
        }
        appendReviewSearchParam(target.searchParams, key, value)
    })
    return target.toString()
}

/**
 * @param {{ el: Element, getOptions: () => { listUrl?: string|null, saveUrl?: string|null } }} ctx
 */
export function createReviewFetch(ctx) {
    /** @type {import('@views-theme/modules/types.js').RequestState} */
    const listState = { controller: null, seq: 0 }
    /** @type {import('@views-theme/modules/types.js').RequestState} */
    const saveState = { controller: null, seq: 0 }

    return {
        /**
         * @param {Record<string, string|string[]>} params
         * @returns {Promise<string|null>}
         */
        async fetchList(params) {
            const listUrl = ctx.getOptions().listUrl
            if (!listUrl) {
                return null
            }

            const { signal, isCurrent } = beginRequest(listState)
            try {
                const html = await fetchText(urlWithReviewParams(listUrl, params), { signal })
                return isCurrent() ? html : null
            } catch (error) {
                if (/** @type {{ name?: string }} */ (error).name === 'AbortError') {
                    return null
                }
                throw error
            }
        },

        /**
         * @param {FormData} formData
         * @returns {Promise<string|null>}
         */
        async saveForm(formData) {
            const saveUrl = ctx.getOptions().saveUrl
            if (!saveUrl) {
                return null
            }

            const { signal, isCurrent } = beginRequest(saveState)
            try {
                const response = await fetch(saveUrl, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal,
                })
                if (!response.ok) {
                    throw new Error(`Review save failed: ${response.status}`)
                }
                const html = await response.text()
                return isCurrent() ? html : null
            } catch (error) {
                if (/** @type {{ name?: string }} */ (error).name === 'AbortError') {
                    return null
                }
                throw error
            }
        },

        abortAll() {
            abortRequest(listState)
            abortRequest(saveState)
        },
    }
}
