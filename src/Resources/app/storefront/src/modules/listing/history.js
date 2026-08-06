/** Listing history push / popstate helpers. */

import { listingHistoryKeys } from '@views-theme/modules/listing/params.js'

/**
 * @returns {{
 *   push: (params: Record<string, string>, options: object, controls: Iterable<unknown>) => void,
 *   shouldIgnorePopstate: () => boolean,
 * }}
 */
export function createHistoryController() {
    let ignorePopstate = false

    return {
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
