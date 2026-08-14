/**
 * DOM parse / mount helpers.
 *
 * @module @views-theme/modules/shared/dom
 */

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
 * @param {string} html
 * @returns {DocumentFragment}
 */
export function parseHtmlFragment(html) {
    const template = document.createElement('template')
    template.innerHTML = String(html || '').trim()
    return template.content
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
        throw new Error('dom: mount markup is empty')
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
 * Swap a nested `[data-component]` island inside root from an HTML string.
 *
 * @param {Element} root
 * @param {string} html
 * @param {string} componentName
 */
export function replaceComponentIsland(root, html, componentName) {
    swapComponentIsland(parseHtmlFragment(html), root, componentName)
}

/**
 * Swap a nested `[data-component]` island.
 * both → replace; existing only → remove; next only → append to target.
 *
 * @param {ParentNode} sourceRoot
 * @param {ParentNode} targetRoot
 * @param {string} componentName
 */
export function swapComponentIsland(sourceRoot, targetRoot, componentName) {
    if (!targetRoot) {
        return
    }

    const next = sourceRoot.querySelector(`[data-component="${componentName}"]`)
    const existing = targetRoot.querySelector(`[data-component="${componentName}"]`)

    if (existing && next) {
        existing.replaceWith(next)
        return
    }

    if (existing && !next) {
        existing.remove()
        return
    }

    if (!existing && next) {
        targetRoot.appendChild(next)
    }
}
