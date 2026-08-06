/**
 * Listing control registry (discover / hydrate / labels).
 *
 * @module @views-theme/modules/listing/controls
 */

import { getInstanceByElement } from '@views-theme/modules/shared/component.js'
import { collectControlValues, urlParams } from '@views-theme/modules/listing/params.js'

/**
 * @typedef {object} ControlsRegistry
 * @property {() => void} refresh
 * @property {() => void} prune
 * @property {(params: import('@views-theme/modules/types.js').ListingRequestParams) => void} hydrateFromParams
 * @property {() => void} hydrateFromUrl
 * @property {() => Record<string, unknown>} collectValues
 * @property {(fn: (control: import('@views-theme/modules/types.js').ListingControl) => void) => void} forEach
 * @property {() => import('@views-theme/modules/types.js').ListingLabel[]} getActiveLabels
 * @property {() => void} clear
 * @property {() => Set<import('@views-theme/modules/types.js').ListingControl>} values
 */

/**
 * @param {import('@views-theme/modules/types.js').ListingModuleContext} ctx
 * @returns {ControlsRegistry}
 */
export function createControlsRegistry(ctx) {
    /** @type {Set<import('@views-theme/modules/types.js').ListingControl>} */
    const controls = new Set()

    /**
     * @param {import('@views-theme/modules/types.js').ListingControl|null|undefined} control
     */
    function register(control) {
        if (!control || typeof control.getValues !== 'function') {
            return
        }
        controls.add(control)
    }

    function prune() {
        controls.forEach((control) => {
            if (!control.el || !document.body.contains(control.el)) {
                controls.delete(control)
            }
        })
    }

    /**
     * @param {ParentNode|null|undefined} root
     */
    function discoverIn(root) {
        if (!root) {
            return
        }

        const names = ctx.getOptions().controlComponents || []
        names.forEach((name) => {
            root.querySelectorAll(`[data-component="${name}"]`).forEach((el) => {
                const instance = /** @type {import('@views-theme/modules/types.js').ListingControl|null} */ (
                    getInstanceByElement(name, el)
                )
                if (instance) {
                    register(instance)
                }
            })
        })
    }

    /**
     * @param {Element|null} drawerEl
     */
    function isFilterDrawerOpen(drawerEl) {
        if (!drawerEl) {
            return false
        }

        const instance = getInstanceByElement('ViewsTheme:Drawer', drawerEl)
        if (instance && typeof /** @type {{ isOpen?: () => boolean }} */ (instance).isOpen === 'function') {
            return Boolean(/** @type {{ isOpen: () => boolean }} */ (instance).isOpen())
        }

        return drawerEl.getAttribute('aria-hidden') !== 'true'
    }

    /**
     * @returns {Element[]}
     */
    function activeFilterPanels() {
        const panelName = ctx.getOptions().panelComponent || 'ViewsTheme:Filter:Panel'
        const panels = [...document.querySelectorAll(`[data-component="${panelName}"]`)]
        const drawer = document.querySelector('#vi-filter-drawer')
        const drawerActive = isFilterDrawerOpen(drawer)

        if (drawerActive && drawer) {
            return panels.filter((panel) => drawer.contains(panel))
        }

        return panels.filter((panel) => !panel.closest('#vi-filter-drawer'))
    }

    function discover() {
        discoverIn(ctx.el)

        const panelName = ctx.getOptions().panelComponent || 'ViewsTheme:Filter:Panel'
        controls.forEach((control) => {
            if (control.el?.closest(`[data-component="${panelName}"]`)) {
                controls.delete(control)
            }
        })

        activeFilterPanels().forEach((panel) => {
            discoverIn(panel)
        })
    }

    function refresh() {
        prune()
        discover()
    }

    /**
     * @param {import('@views-theme/modules/types.js').ListingRequestParams} params
     */
    function hydrateFromParams(params) {
        controls.forEach((control) => {
            if (typeof control.setFromUrl === 'function') {
                control.setFromUrl(params || {})
            }
        })
    }

    function hydrateFromUrl() {
        hydrateFromParams(urlParams())
    }

    function collectValues() {
        return collectControlValues(controls)
    }

    /**
     * @param {(control: import('@views-theme/modules/types.js').ListingControl) => void} fn
     */
    function forEach(fn) {
        controls.forEach(fn)
    }

    /**
     * @returns {import('@views-theme/modules/types.js').ListingLabel[]}
     */
    function getActiveLabels() {
        refresh()

        /** @type {import('@views-theme/modules/types.js').ListingLabel[]} */
        const labels = []
        const seen = new Set()
        controls.forEach((control) => {
            if (typeof control.getLabels !== 'function') {
                return
            }

            control.getLabels().forEach((item) => {
                const id = item?.id
                if (id !== undefined && id !== null && seen.has(String(id))) {
                    return
                }
                if (id !== undefined && id !== null) {
                    seen.add(String(id))
                }
                labels.push(item)
            })
        })
        return labels
    }

    function clear() {
        controls.clear()
    }

    function values() {
        return controls
    }

    return {
        refresh,
        prune,
        hydrateFromParams,
        hydrateFromUrl,
        collectValues,
        forEach,
        getActiveLabels,
        clear,
        values,
    }
}
