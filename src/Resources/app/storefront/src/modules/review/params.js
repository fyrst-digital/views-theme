/**
 * Review query/param helpers (URL SoT).
 *
 * @module @views-theme/modules/review/params
 */

import {
    collectControlValues,
    objectOption,
} from '@views-theme/modules/shared/object-option.js'

export { collectControlValues, objectOption }

/**
 * Core loader needs `points` as a list. Scalar `points=5` is ignored by PHP
 * unless normalized server-side; prefer `points[]=` in the public URL.
 *
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @param {string|string[]} value
 */
export function appendReviewSearchParam(searchParams, key, value) {
    if (key === 'points') {
        const items = Array.isArray(value) ? value : [value]
        items.forEach((item) => {
            if (item !== null && item !== undefined && item !== '') {
                searchParams.append('points[]', String(item))
            }
        })
        return
    }

    if (Array.isArray(value)) {
        value.forEach((item) => {
            searchParams.append(key, String(item))
        })
        return
    }

    searchParams.set(key, String(value))
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string} key
 */
export function deleteReviewSearchParam(searchParams, key) {
    searchParams.delete(key)
    if (key === 'points') {
        searchParams.delete('points[]')
    }
}

/**
 * @param {{ baseParams?: Record<string, unknown> }} options
 * @param {Record<string, unknown>} controlParams
 * @returns {Record<string, string|string[]>}
 */
export function buildRequestParams(options, controlParams) {
    const merged = {
        ...objectOption(options.baseParams),
        ...controlParams,
    }

    /** @type {Record<string, string|string[]>} */
    const out = {}
    Object.entries(merged).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            return
        }
        if (Array.isArray(value)) {
            if (value.length) {
                out[key] = value.map(String)
            }
            return
        }
        out[key] = String(value)
    })

    return out
}

/**
 * @param {{ baseParams?: Record<string, unknown> }} options
 * @param {Iterable<{ getParamKeys?: () => string[] }>} controls
 * @returns {Set<string>}
 */
export function reviewHistoryKeys(options, controls) {
    const keys = new Set(['p', 'sort', 'language', 'points', 'points[]'])

    Object.keys(objectOption(options.baseParams)).forEach((key) => {
        keys.add(key)
    })

    for (const control of controls) {
        const fromMethod = typeof control.getParamKeys === 'function' ? control.getParamKeys() : []
        const list = Array.isArray(fromMethod) ? fromMethod : []
        list.forEach((key) => keys.add(key))
    }

    return keys
}

/**
 * @returns {Record<string, string|string[]>}
 */
export function urlParams() {
    const params = new URLSearchParams(window.location.search)
    /** @type {Record<string, string|string[]>} */
    const out = {}

    params.forEach((value, key) => {
        const normKey = key === 'points[]' ? 'points' : key

        if (Object.prototype.hasOwnProperty.call(out, normKey)) {
            const prev = out[normKey]
            out[normKey] = Array.isArray(prev)
                ? [...prev, value]
                : [/** @type {string} */ (prev), value]
            return
        }
        out[normKey] = value
    })

    // Pipe-joined multi (legacy compact form)
    if (typeof out.points === 'string' && out.points.includes('|')) {
        out.points = out.points.split('|').filter(Boolean)
    }

    // Scalar points → list (matches loader / Matrix control)
    if (typeof out.points === 'string' && out.points !== '') {
        out.points = [out.points]
    }

    return out
}
