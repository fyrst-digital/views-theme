/** Pure listing query/param helpers. */

/**
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
export function objectOption(value) {
    if (!value || Array.isArray(value)) {
        return {}
    }
    return typeof value === 'object' ? value : {}
}

/**
 * @param {object} options
 * @param {Record<string, unknown>} controlParams
 * @returns {Record<string, string>}
 */
export function buildRequestParams(options, controlParams) {
    const merged = {
        ...objectOption(options.baseParams),
        ...objectOption(options.display),
        ...controlParams,
    }

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
 * @param {Iterable<{ getValues?: () => Record<string, unknown> }>} controls
 * @returns {Record<string, unknown>}
 */
export function collectControlValues(controls) {
    const values = {}
    for (const control of controls) {
        const part = (typeof control.getValues === 'function' ? control.getValues() : null) || {}
        Object.entries(part).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                const merged = [...(values[key] || []), ...value]
                values[key] = [...new Set(merged)]
                return
            }
            if (value !== null && value !== undefined && value !== '') {
                values[key] = value
            }
        })
    }
    return values
}

/**
 * @param {object} options
 * @param {Iterable<{ getParamKeys?: () => string[] }>} controls
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
 * @returns {Record<string, string>}
 */
export function urlParams() {
    return Object.fromEntries(new URLSearchParams(window.location.search).entries())
}
