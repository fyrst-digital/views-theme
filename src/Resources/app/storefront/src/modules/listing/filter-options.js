/** Apply filter-options payload / reduced aggregations onto controls. */

/**
 * @param {Iterable<object>} controls
 * @param {{ options?: Record<string, string>, meta?: Record<string, Record<string, unknown>> }} payload
 */
export function applyFilterOptionsPayload(controls, payload) {
    if (!payload || typeof payload !== 'object') {
        return
    }

    const options = payload.options || {}
    const meta = payload.meta || {}

    for (const control of controls) {
        const key = control.options?.filterKey
            || control.el?.getAttribute?.('data-filter-key')
            || control.options?.name
        if (!key) {
            continue
        }

        if (typeof options[key] === 'string' && typeof control.replaceOptions === 'function') {
            control.replaceOptions(options[key])
        }

        if (meta[key] && typeof control.applyOptionsMeta === 'function') {
            control.applyOptionsMeta(meta[key])
        }
    }
}

/**
 * @param {Iterable<object>} controls
 * @param {object} aggregations
 */
export function applyAvailability(controls, aggregations) {
    for (const control of controls) {
        if (typeof control.applyAvailability === 'function') {
            control.applyAvailability(aggregations)
            continue
        }
        if (typeof control.refreshDisabled === 'function') {
            control.refreshDisabled(aggregations)
        }
    }
}

/**
 * Control key for batch options map.
 *
 * @param {object} control
 * @returns {string|null}
 */
export function controlFilterKey(control) {
    const key = control.options?.filterKey
        || control.el?.getAttribute?.('data-filter-key')
        || control.options?.name
    return key || null
}
