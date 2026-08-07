/**
 * Review history push / popstate helpers.
 *
 * @module @views-theme/modules/review/history
 */

import {
    appendReviewSearchParam,
    deleteReviewSearchParam,
    reviewHistoryKeys,
} from '@views-theme/modules/review/params.js'
import { createHistoryController as createSharedHistoryController } from '@views-theme/modules/shared/history.js'

/**
 * @returns {import('@views-theme/modules/shared/history.js').HistoryController}
 */
export function createHistoryController() {
    return createSharedHistoryController({
        getKeys: reviewHistoryKeys,
        skipKeys: () => ['parentId', 'productId'],
        writeParam: appendReviewSearchParam,
        deleteParam: deleteReviewSearchParam,
    })
}
