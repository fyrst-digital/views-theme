/**
 * Shopware component instance helpers.
 *
 * Shopware mounts inserted `[data-component]` nodes from a MutationObserver
 * after a dynamic import-map `import()`. On a cold production chunk that
 * import can take longer than any frame-count poll, so callers must not race
 * the observer. `mountComponents` awaits the same import (`Shopware.getComponent`)
 * and instantiates via `Shopware.initializeComponentOnElement`. Both are
 * idempotent with the observer path, so whichever runs first wins and the
 * other reuses the instance.
 *
 * @module @views-theme/modules/shared/component
 */

/**
 * @param {string} componentName
 * @param {Element|null|undefined} el
 * @returns {ShopwareComponent|null}
 */
export function getInstanceByElement(componentName, el) {
    if (!el || !window.Shopware?.getComponentInstanceByElement) {
        return null
    }

    return window.Shopware.getComponentInstanceByElement(componentName, el) || null
}

/**
 * Mount `[data-component]` nodes in `root` (root included) and resolve once
 * they have instances. Each component chunk is imported once, in parallel.
 * Elements are then instantiated in document order (parent before child), as
 * on page boot.
 *
 * Nodes that leave the document while chunks load are skipped. The observer
 * would never destroy a detached instance. A component whose import fails, or
 * whose constructor throws, is skipped (logged). Check the instance afterwards
 * with `getInstanceByElement`.
 *
 * @param {Element|null|undefined} root
 * @param {string[]} [componentNames] only these names (default: every component in the tree)
 * @returns {Promise<void>}
 */
export async function mountComponents(root, componentNames) {
    const shopware = window.Shopware
    if (!root?.isConnected || typeof shopware?.getComponent !== 'function') {
        return
    }

    const only = componentNames ? new Set(componentNames) : null
    const els = [root, ...root.querySelectorAll('[data-component]')].filter((el) => {
        const name = el.getAttribute('data-component')
        return Boolean(name) && (!only || only.has(name))
    })
    if (!els.length) {
        return
    }

    const names = [...new Set(els.map((el) => el.getAttribute('data-component')))]
    const classes = new Map(
        await Promise.all(names.map(async (name) => [name, await shopware.getComponent(name)])),
    )

    for (const el of els) {
        const name = el.getAttribute('data-component')
        const component = classes.get(name)
        if (!component || !el.isConnected) {
            continue
        }
        try {
            shopware.initializeComponentOnElement(name, component, el)
        } catch (error) {
            // One broken child must not keep the shell from opening.
            console.error(`Component ${name} failed to initialize`, error)
        }
    }
}

/**
 * Normalize Drawer Open/Close bus payload to an element.
 *
 * @param {unknown} payload
 * @returns {Element|null}
 */
export function eventEl(payload) {
    if (!payload) {
        return null
    }
    if (payload instanceof Element) {
        return payload
    }
    if (typeof payload === 'object' && payload !== null && 'el' in payload) {
        const el = /** @type {{ el?: unknown }} */ (payload).el
        return el instanceof Element ? el : null
    }
    return null
}
