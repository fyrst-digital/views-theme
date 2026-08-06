/**
 * Listing XHR (results HTML, filter-options, aggregations).
 *
 * @module @views-theme/modules/listing/fetch
 */

import { abortRequest, beginRequest, fetchJson, fetchText, urlWithParams } from '@views-theme/modules/shared/http.js'

/**
 * @typedef {object} ListingFetchApi
 * @property {(params: import('@views-theme/modules/types.js').ListingRequestParams) => Promise<string>} fetchResultsHtml
 * @property {(params: import('@views-theme/modules/types.js').ListingRequestParams) => Promise<import('@views-theme/modules/types.js').FilterOptionsPayload|null>} fetchFilterOptions
 * @property {(params: import('@views-theme/modules/types.js').ListingRequestParams) => Promise<object|null>} fetchAggregations
 * @property {() => void} abortAll
 */

/**
 * @param {import('@views-theme/modules/types.js').ListingModuleContext} ctx
 * @returns {ListingFetchApi}
 */
export function createListingFetch(ctx) {
    /** @type {import('@views-theme/modules/types.js').RequestState} */
    const resultsState = { controller: null, seq: 0 }
    /** @type {import('@views-theme/modules/types.js').RequestState} */
    const optionsState = { controller: null, seq: 0 }

    /**
     * @returns {Set<string>}
     */
    function optionsSkipKeys() {
        const skip = new Set(ctx.getOptions().displayParamKeys || [])
        skip.add('p')
        skip.add('order')
        return skip
    }

    /**
     * @param {import('@views-theme/modules/types.js').ListingRequestParams} params
     */
    async function fetchResultsHtml(params) {
        abortRequest(resultsState)
        const req = beginRequest(resultsState)
        const url = urlWithParams(/** @type {string} */ (ctx.getOptions().resultsUrl), params)
        return fetchText(url, { signal: req.signal })
    }

    /**
     * @param {import('@views-theme/modules/types.js').ListingRequestParams} params
     * @returns {Promise<import('@views-theme/modules/types.js').FilterOptionsPayload|null>}
     */
    async function fetchFilterOptions(params) {
        const req = beginRequest(optionsState)
        const url = urlWithParams(
            /** @type {string} */ (ctx.getOptions().filterOptionsUrl),
            params,
            optionsSkipKeys(),
        )
        const payload = /** @type {import('@views-theme/modules/types.js').FilterOptionsPayload} */ (
            await fetchJson(url, { signal: req.signal })
        )
        if (!req.isCurrent()) {
            return null
        }
        return payload
    }

    /**
     * @param {import('@views-theme/modules/types.js').ListingRequestParams} params
     * @returns {Promise<object|null>}
     */
    async function fetchAggregations(params) {
        const req = beginRequest(optionsState)
        const url = urlWithParams(
            /** @type {string} */ (ctx.getOptions().aggregationsUrl),
            params,
            optionsSkipKeys(),
        )
        const aggregations = await fetchJson(url, { signal: req.signal })
        if (!req.isCurrent()) {
            return null
        }
        return /** @type {object} */ (aggregations)
    }

    function abortAll() {
        abortRequest(resultsState)
        abortRequest(optionsState)
    }

    return {
        fetchResultsHtml,
        fetchFilterOptions,
        fetchAggregations,
        abortAll,
    }
}
