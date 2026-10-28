/**
 * Apply filter-options payload / reduced aggregations onto controls.
 *
 * @module @views-theme/modules/listing/filter-options
 */

/**
 * @param {import('@views-theme/modules/types.js').ListingControl} control
 * @returns {string|null}
 */
export function controlFilterKey(control) {
    const key = control.options?.filterKey
        || control.el?.getAttribute?.('data-filter-key')
        || control.options?.name
    return key || null
}

/**
 * @param {import('@views-theme/modules/types.js').ListingControl} control
 * @param {import('@views-theme/modules/types.js').FilterOptionsPayload} payload
 */
export function applyFilterOptionsToControl(control, payload) {
    if (!payload || typeof payload !== 'object') {
        return
    }

    const key = controlFilterKey(control)
    if (!key) {
        return
    }

    const options = payload.options || {}
    const meta = payload.meta || {}

    if (typeof options[key] === 'string' && typeof control.replaceOptions === 'function') {
        control.replaceOptions(options[key])
    }

    if (meta[key] && typeof control.applyOptionsMeta === 'function') {
        control.applyOptionsMeta(meta[key])
    }
}

/**
 * @param {Iterable<import('@views-theme/modules/types.js').ListingControl>} controls
 * @param {object} aggregations
 */
export function applyAvailability(controls, aggregations) {
    for (const control of controls) {
        if (typeof control.applyAvailability === 'function') {
            control.applyAvailability(aggregations)
        }
    }
}
