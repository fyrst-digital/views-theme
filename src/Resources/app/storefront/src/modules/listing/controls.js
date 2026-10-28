/**
 * Listing control registry. Controls register themselves (`connect` in `init`,
 * the returned disconnect in `destroy`); nothing scans the DOM.
 *
 * Several controls can share one identity (same filter key + param keys): the bar facet and
 * the same facet inside the filter drawer, top and bottom pagination. Per
 * identity the **last connected** control is the active one — it provides
 * values and labels. When it disconnects (drawer closes, island swapped) the
 * previous one becomes active again. Hydration, options and availability apply
 * to every connected control so the inactive twin never goes stale.
 *
 * `connect` never triggers a request. It hydrates the control from the last
 * applied params (URL before the first apply) and applies the cached
 * filter-options payload.
 *
 * @module @views-theme/modules/listing/controls
 */
import { applyAvailability, applyFilterOptionsToControl, controlFilterKey } from '@views-theme/modules/listing/filter-options.js'
import { collectControlValues, urlParams } from '@views-theme/modules/listing/params.js'
import { params } from '@views-theme/modules/listing/state.js'
import { createRegistry } from '@views-theme/modules/shared/registry.js'

/** @type {import('@views-theme/modules/shared/registry.js').Registry<import('@views-theme/modules/types.js').ListingControl>} */
const registry = createRegistry({ identify: identityOf })

/** Bumped (batched) whenever a control connects or disconnects. */
export const controlsVersion = registry.version

/** @type {import('@views-theme/modules/types.js').FilterOptionsPayload|null} */
let optionsPayload = null

/**
 * @param {import('@views-theme/modules/types.js').ListingControl} control
 * @returns {string|symbol}
 */
function identityOf(control) {
    const keys = typeof control.getParamKeys === 'function' ? control.getParamKeys() : []
    if (!Array.isArray(keys) || !keys.length) {
        return Symbol('listing-control')
    }

    // Property facets share the param key `properties`; their filter key tells them apart.
    return [controlFilterKey(control) || '', ...keys].join('\u0000')
}

/**
 * @returns {Record<string, unknown>}
 */
function currentParams() {
    const applied = params.get()

    return Object.keys(applied).length ? applied : urlParams()
}

/**
 * @param {import('@views-theme/modules/types.js').ListingControl} control
 * @returns {() => void} disconnect
 */
export function connect(control) {
    if (!control || typeof control.getValues !== 'function') {
        return () => {}
    }

    const disconnect = registry.connect(control)

    if (typeof control.setFromUrl === 'function') {
        control.setFromUrl(/** @type {Record<string, string>} */ (currentParams()))
    }
    if (optionsPayload) {
        applyFilterOptionsToControl(control, optionsPayload)
    }

    return disconnect
}

/**
 * Every connected control.
 *
 * @returns {import('@views-theme/modules/types.js').ListingControl[]}
 */
export function all() {
    return registry.all()
}

/**
 * The active (last connected) control per identity.
 *
 * @returns {import('@views-theme/modules/types.js').ListingControl[]}
 */
export function active() {
    return registry.active()
}

/**
 * @param {Record<string, unknown>} next
 */
export function hydrate(next) {
    all().forEach((control) => {
        if (typeof control.setFromUrl === 'function') {
            control.setFromUrl(/** @type {Record<string, string>} */ (next || {}))
        }
    })
}

export function hydrateFromUrl() {
    hydrate(urlParams())
}

/**
 * @returns {Record<string, unknown>}
 */
export function collectValues() {
    return collectControlValues(active())
}

/**
 * @returns {import('@views-theme/modules/types.js').ListingLabel[]}
 */
export function activeLabels() {
    /** @type {import('@views-theme/modules/types.js').ListingLabel[]} */
    const labels = []
    const seen = new Set()
    active().forEach((control) => {
        if (typeof control.getLabels !== 'function') {
            return
        }

        control.getLabels().forEach((item) => {
            const id = item?.id
            if (id !== undefined && id !== null) {
                if (seen.has(String(id))) {
                    return
                }
                seen.add(String(id))
            }
            labels.push(item)
        })
    })

    return labels
}

/**
 * Cache the latest filter-options payload (applied to controls that connect later) and apply it now.
 *
 * @param {import('@views-theme/modules/types.js').FilterOptionsPayload|null} payload
 */
export function setOptionsPayload(payload) {
    optionsPayload = payload
    if (!payload) {
        return
    }

    all().forEach((control) => {
        applyFilterOptionsToControl(control, payload)
    })
}

/**
 * @param {object} aggregations
 */
export function setAvailability(aggregations) {
    applyAvailability(all(), aggregations)
}
