/**
 * Ref-counted body scroll lock for stacked shells (Drawer + Search Overlay).
 *
 * @module @views-theme/modules/body-lock
 */

/** @type {Set<string|symbol>} */
const owners = new Set()

/**
 * @param {string} className
 * @param {string|symbol} owner
 * @param {boolean} locked
 */
export function setBodyLock(className, owner, locked) {
    if (!className || owner == null) {
        return
    }

    if (locked) {
        owners.add(owner)
    } else {
        owners.delete(owner)
    }

    document.body.classList.toggle(className, owners.size > 0)
}
