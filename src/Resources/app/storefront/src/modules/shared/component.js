/**
 * Shopware component instance helpers.
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
 * @param {() => unknown} getInstance
 * @param {number} [retries]
 * @returns {Promise<unknown>}
 */
export async function waitForInstance(getInstance, retries = 20) {
    for (let i = 0; i < retries; i++) {
        const instance = getInstance()
        if (instance) {
            return instance
        }

        await new Promise((resolve) => {
            requestAnimationFrame(resolve)
        })
    }

    return getInstance()
}

/**
 * Wait until every named component under root has a mounted instance
 * (or no matching elements exist).
 *
 * @param {Element} root
 * @param {string[]} componentNames
 * @param {number} [retries]
 * @returns {Promise<void>}
 */
export async function waitForComponentsIn(root, componentNames, retries = 20) {
    if (!root || !window.Shopware?.getComponentInstanceByElement) {
        return
    }

    const names = componentNames || []

    for (let i = 0; i < retries; i++) {
        const ready = names.every((name) => {
            const els = root.querySelectorAll(`[data-component="${name}"]`)
            if (!els.length) {
                return true
            }
            return [...els].every((el) => getInstanceByElement(name, el))
        })
        if (ready) {
            return
        }

        await new Promise((resolve) => {
            requestAnimationFrame(resolve)
        })
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
