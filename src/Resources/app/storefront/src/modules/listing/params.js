/**
 * Pure listing query/param helpers.
 *
 * @module @views-theme/modules/listing/params
 */

import {
    collectControlValues,
    objectOption,
} from '@views-theme/modules/shared/object-option.js'

export { collectControlValues, objectOption }

/**
 * @param {import('@views-theme/modules/types.js').ListingOptions} options
 * @param {Record<string, unknown>} controlParams
 * @returns {import('@views-theme/modules/types.js').ListingRequestParams}
 */
export function buildRequestParams(options, controlParams) {
    const merged = {
        ...objectOption(options.baseParams),
        ...objectOption(options.display),
        ...controlParams,
    }

    /** @type {import('@views-theme/modules/types.js').ListingRequestParams} */
    const out = {}
    Object.entries(merged).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            return
        }
        if (Array.isArray(value)) {
            if (value.length) {
                out[key] = value.join('|')
            }
            return
        }
        out[key] = String(value)
    })

    return out
}

/**
 * @param {import('@views-theme/modules/types.js').ListingOptions} options
 * @param {Iterable<import('@views-theme/modules/types.js').ListingControl>} controls
 * @returns {Set<string>}
 */
export function listingHistoryKeys(options, controls) {
    const keys = new Set(['p', 'order'])

    Object.keys(objectOption(options.baseParams)).forEach((key) => {
        keys.add(key)
    })

    for (const control of controls) {
        const fromMethod = typeof control.getParamKeys === 'function'
            ? control.getParamKeys()
            : []
        const list = Array.isArray(fromMethod) ? fromMethod : []
        list.forEach((key) => keys.add(key))
    }

    return keys
}

/**
 * @returns {import('@views-theme/modules/types.js').ListingRequestParams}
 */
export function urlParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries())
}
