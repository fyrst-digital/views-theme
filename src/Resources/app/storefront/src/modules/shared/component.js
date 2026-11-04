/**
 * Shopware component instance helpers.
 *
 * Shopware mounts lazily inserted `[data-component]` nodes via MutationObserver
 * after a dynamic import-map `import()`. A short rAF poll loses that race on a
 * cold production chunk. Waiters use a time budget and, when a component name
 * is known, `Shopware.initializeComponent` so the import is awaited instead of
 * raced against the observer.
 *
 * @module @views-theme/modules/shared/component
 */

/** Default wait for cold import-map loads after a lazy DOM insert. */
export const COMPONENT_MOUNT_TIMEOUT_MS = 10_000

/**
 * @typedef {object} ComponentWaitOptions
 * @property {number} [timeoutMs]
 * @property {string|null} [componentName]
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
 * Await Shopware's import-map load and instantiate every matching
 * `[data-component]` currently in the document. Idempotent: already-mounted
 * elements are skipped.
 *
 * @param {string} componentName
 * @returns {Promise<void>}
 */
export async function ensureComponentInitialized(componentName) {
    if (!componentName || typeof window.Shopware?.initializeComponent !== 'function') {
        return
    }

    await window.Shopware.initializeComponent(componentName)
}

/**
 * @param {number|ComponentWaitOptions|undefined} retriesOrOptions
 * @returns {{ timeoutMs: number, componentName: string|null }}
 */
function normalizeWaitOptions(retriesOrOptions) {
    if (retriesOrOptions && typeof retriesOrOptions === 'object') {
        const timeoutMs = retriesOrOptions.timeoutMs
        return {
            timeoutMs: typeof timeoutMs === 'number' ? timeoutMs : COMPONENT_MOUNT_TIMEOUT_MS,
            componentName: retriesOrOptions.componentName || null,
        }
    }

    return {
        timeoutMs: COMPONENT_MOUNT_TIMEOUT_MS,
        componentName: null,
    }
}

/**
 * Yield until the next frame (or a short timer when rAF is missing).
 *
 * @returns {Promise<void>}
 */
function waitFrame() {
    return new Promise((resolve) => {
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => resolve())
            return
        }
        setTimeout(resolve, 16)
    })
}

/**
 * @param {() => unknown} getValue
 * @param {number} timeoutMs
 * @returns {Promise<unknown>}
 */
async function pollUntil(getValue, timeoutMs) {
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
        const value = getValue()
        if (value) {
            return value
        }

        await waitFrame()
    }

    return getValue()
}

/**
 * @param {Element} el
 * @param {string} name
 * @returns {boolean}
 */
function elementMatchesComponent(el, name) {
    const selector = `[data-component="${name}"]`
    if (typeof el.matches === 'function') {
        return el.matches(selector)
    }
    return el.getAttribute?.('data-component') === name
}

/**
 * Named `[data-component]` nodes on root itself and descendants.
 *
 * @param {Element} root
 * @param {string} name
 * @returns {Element[]}
 */
function namedElementsIn(root, name) {
    const nested = [...root.querySelectorAll(`[data-component="${name}"]`)]
    if (elementMatchesComponent(root, name) && !nested.includes(root)) {
        return [root, ...nested]
    }
    return nested
}

/**
 * Unique `data-component` names on root and descendants.
 *
 * @param {Element} root
 * @returns {string[]}
 */
function componentNamesIn(root) {
    const names = new Set()
    const rootName = root.getAttribute?.('data-component')
    if (rootName) {
        names.add(rootName)
    }
    root.querySelectorAll('[data-component]').forEach((el) => {
        const name = el.getAttribute('data-component')
        if (name) {
            names.add(name)
        }
    })
    return [...names]
}

/**
 * Wait until `getInstance()` returns a truthy component instance.
 *
 * Numeric `retries` from older call sites is ignored: the waiter uses a time
 * budget so a cold chunk load is not capped at ~20 frames.
 *
 * @param {() => unknown} getInstance
 * @param {number|ComponentWaitOptions} [retriesOrOptions]
 * @returns {Promise<unknown>}
 */
export async function waitForInstance(getInstance, retriesOrOptions) {
    const options = normalizeWaitOptions(retriesOrOptions)

    const existing = getInstance()
    if (existing) {
        return existing
    }

    if (options.componentName) {
        await ensureComponentInitialized(options.componentName)
        const mounted = getInstance()
        if (mounted) {
            return mounted
        }
    }

    return pollUntil(getInstance, options.timeoutMs)
}

/**
 * Wait until every named component under root has a mounted instance
 * (or no matching elements exist). Includes `root` when it itself matches.
 *
 * @param {Element} root
 * @param {string[]} componentNames
 * @param {number|ComponentWaitOptions} [retriesOrOptions]
 * @returns {Promise<void>}
 */
export async function waitForComponentsIn(root, componentNames, retriesOrOptions) {
    if (!root || !window.Shopware?.getComponentInstanceByElement) {
        return
    }

    const names = componentNames || []
    const options = normalizeWaitOptions(retriesOrOptions)

    const isReady = () =>
        names.every((name) => {
            const els = namedElementsIn(root, name)
            if (!els.length) {
                return true
            }
            return els.every((el) => getInstanceByElement(name, el))
        })

    if (isReady()) {
        return
    }

    await Promise.all(names.map((name) => ensureComponentInitialized(name)))
    if (isReady()) {
        return
    }

    await pollUntil(() => (isReady() ? true : null), options.timeoutMs)
}

/**
 * After inserting lazy-shell HTML, wait until every `[data-component]` in the
 * tree (shell root and nested panels, bars, …) has a mounted instance.
 *
 * @param {Element|null|undefined} root
 * @param {number|ComponentWaitOptions} [retriesOrOptions]
 * @returns {Promise<void>}
 */
export async function waitForMountedTree(root, retriesOrOptions) {
    if (!root) {
        return
    }

    await waitForComponentsIn(root, componentNamesIn(root), retriesOrOptions)
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
