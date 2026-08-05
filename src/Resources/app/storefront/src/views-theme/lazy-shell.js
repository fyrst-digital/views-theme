/** Shared mount/wait/unmount helpers for lazy-loaded shell Actions. */

/**
 * @param {string} html
 * @returns {Element|null}
 */
export function parseHtmlRoot(html) {
    const template = document.createElement('template')
    template.innerHTML = String(html || '').trim()
    return template.content.firstElementChild
}

/**
 * @param {string} selector
 * @param {string} html
 * @param {ParentNode} [appendTo]
 * @returns {Element}
 */
export function replaceMount(selector, html, appendTo = document.body) {
    const existing = document.querySelector(selector)
    if (existing) {
        existing.remove()
    }

    const el = parseHtmlRoot(html)
    if (!el) {
        throw new Error('lazy-shell: mount markup is empty')
    }

    appendTo.appendChild(el)
    return el
}

/**
 * @param {Element|null|undefined} el
 * @param {string} [selector]
 */
export function unmountEl(el, selector) {
    const target = el || (selector ? document.querySelector(selector) : null)
    if (target) {
        target.remove()
    }
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
 * @param {string} componentName
 * @param {Element|null} el
 * @returns {unknown}
 */
export function getInstanceByElement(componentName, el) {
    if (!el || !window.Shopware?.getComponentInstanceByElement) {
        return null
    }

    return window.Shopware.getComponentInstanceByElement(componentName, el)
}

/**
 * @param {string} url
 * @param {{ signal?: AbortSignal, headers?: Record<string, string> }} [options]
 * @returns {Promise<string>}
 */
export async function fetchText(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {}),
        },
        signal: options.signal,
    })

    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`)
    }

    return response.text()
}

/**
 * @returns {{ controller: AbortController, signal: AbortSignal, id: number, isCurrent: () => boolean }}
 */
export function beginRequest(state) {
    if (state.controller) {
        state.controller.abort()
    }

    state.seq = (state.seq || 0) + 1
    const id = state.seq
    const controller = new AbortController()
    state.controller = controller

    return {
        controller,
        signal: controller.signal,
        id,
        isCurrent: () => state.seq === id && state.controller === controller,
    }
}

/**
 * @param {{ controller?: AbortController|null }} state
 */
export function abortRequest(state) {
    if (state.controller) {
        state.controller.abort()
        state.controller = null
    }
}
