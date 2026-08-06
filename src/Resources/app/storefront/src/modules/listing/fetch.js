/** Listing XHR (results HTML, filter-options, aggregations). */

import { abortRequest, beginRequest, fetchJson, fetchText, urlWithParams } from '@views-theme/modules/shared/http.js'

/**
 * @param {{ getOptions: () => object }} ctx
 */
export function createListingFetch(ctx) {
    const resultsState = { controller: null, seq: 0 }
    const optionsState = { controller: null, seq: 0 }

    function optionsSkipKeys() {
        const skip = new Set(ctx.getOptions().displayParamKeys || [])
        skip.add('p')
        skip.add('order')
        return skip
    }

    async function fetchResultsHtml(params) {
        abortRequest(resultsState)
        const req = beginRequest(resultsState)
        const url = urlWithParams(ctx.getOptions().resultsUrl, params)
        return fetchText(url, { signal: req.signal })
    }

    /**
     * @returns {Promise<object|null>}
     */
    async function fetchFilterOptions(params) {
        const req = beginRequest(optionsState)
        const url = urlWithParams(
            ctx.getOptions().filterOptionsUrl,
            params,
            optionsSkipKeys(),
        )
        const payload = await fetchJson(url, { signal: req.signal })
        if (!req.isCurrent()) {
            return null
        }
        return payload
    }

    /**
     * @returns {Promise<object|null>}
     */
    async function fetchAggregations(params) {
        const req = beginRequest(optionsState)
        const url = urlWithParams(
            ctx.getOptions().aggregationsUrl,
            params,
            optionsSkipKeys(),
        )
        const aggregations = await fetchJson(url, { signal: req.signal })
        if (!req.isCurrent()) {
            return null
        }
        return aggregations
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
