/** Listing control registry (discover / hydrate / labels). */

import { getInstanceByElement } from '@views-theme/modules/shared/component.js'
import { collectControlValues, urlParams } from '@views-theme/modules/listing/params.js'

/**
 * @param {{
 *   el: Element,
 *   getOptions: () => object,
 * }} ctx
 */
export function createControlsRegistry(ctx) {
    const controls = new Set()

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

    function discoverIn(root) {
        if (!root) {
            return
        }

        const names = ctx.getOptions().controlComponents || []
        names.forEach((name) => {
            root.querySelectorAll(`[data-component="${name}"]`).forEach((el) => {
                const instance = getInstanceByElement(name, el)
                if (instance) {
                    register(instance)
                }
            })
        })
    }

    function isFilterDrawerOpen(drawerEl) {
        if (!drawerEl) {
            return false
        }

        const instance = getInstanceByElement('ViewsTheme:Drawer', drawerEl)
        if (instance && typeof instance.isOpen === 'function') {
            return Boolean(instance.isOpen())
        }

        return drawerEl.getAttribute('aria-hidden') !== 'true'
    }

    function activeFilterPanels() {
        const panelName = ctx.getOptions().panelComponent || 'ViewsTheme:Filter:Panel'
        const panels = [...document.querySelectorAll(`[data-component="${panelName}"]`)]
        const drawer = document.querySelector('#vi-filter-drawer')
        const drawerActive = isFilterDrawerOpen(drawer)

        if (drawerActive) {
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
        refresh()
        return collectControlValues(controls)
    }

    function forEach(fn) {
        controls.forEach(fn)
    }

    function getActiveLabels() {
        refresh()

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
