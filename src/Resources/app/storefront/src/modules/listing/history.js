/**
 * Listing history push / popstate helpers.
 *
 * @module @views-theme/modules/listing/history
 */

import { listingHistoryKeys } from '@views-theme/modules/listing/params.js'
import { createHistoryController as createSharedHistoryController } from '@views-theme/modules/shared/history.js'

/**
 * @returns {import('@views-theme/modules/shared/history.js').HistoryController}
 */
export function createHistoryController() {
    return createSharedHistoryController({
        getKeys: listingHistoryKeys,
        skipKeys: (options) => options.displayParamKeys || [],
        writeParam: (searchParams, key, value) => {
            searchParams.set(key, String(value))
        },
    })
}
