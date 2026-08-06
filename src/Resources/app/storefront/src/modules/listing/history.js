/**
 * Listing history push / popstate helpers.
 *
 * @module @views-theme/modules/listing/history
 */

import { listingHistoryKeys } from '@views-theme/modules/listing/params.js'

/**
 * @typedef {object} HistoryController
 * @property {(
 *   params: import('@views-theme/modules/types.js').ListingRequestParams,
 *   options: import('@views-theme/modules/types.js').ListingOptions,
 *   controls: Iterable<import('@views-theme/modules/types.js').ListingControl>,
 * ) => void} push
 * @property {() => boolean} shouldIgnorePopstate
 */

/**
 * @returns {HistoryController}
 */
export function createHistoryController() {
    let ignorePopstate = false

    return {
        /**
         * @param {import('@views-theme/modules/types.js').ListingRequestParams} params
         * @param {import('@views-theme/modules/types.js').ListingOptions} options
         * @param {Iterable<import('@views-theme/modules/types.js').ListingControl>} controls
         */
        push(params, options, controls) {
            const skip = new Set(options.displayParamKeys || [])
            const keys = listingHistoryKeys(options, controls)
            const url = new URL(window.location.href)

            keys.forEach((key) => {
                url.searchParams.delete(key)
            })

            Object.entries(params).forEach(([key, value]) => {
                if (skip.has(key)) {
                    return
                }
                url.searchParams.set(key, value)
            })

            ignorePopstate = true
            window.history.pushState({}, '', url.toString())
            queueMicrotask(() => {
                ignorePopstate = false
            })
        },

        shouldIgnorePopstate() {
            return ignorePopstate
        },
    }
}
