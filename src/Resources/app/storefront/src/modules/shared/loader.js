/**
 * Page-blocking loader overlay, ref-counted by owner.
 *
 * One overlay element for any number of owners (e.g. several configurators);
 * it is removed with the last owner. Scroll lock goes through `body-lock.js`.
 *
 * @module @views-theme/modules/shared/loader
 */
import { setBodyLock } from '@views-theme/modules/body-lock.js'

const BODY_LOCK_CLASS = 'overflow-hidden'

/** @type {Set<string|symbol>} */
const owners = new Set()

/** @type {Element|null} */
let overlay = null

/**
 * @param {string|symbol} owner
 */
export function showLoader(owner) {
    if (owner == null || owners.has(owner)) {
        return
    }

    owners.add(owner)
    setBodyLock(BODY_LOCK_CLASS, owner, true)

    if (!overlay) {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div class="modal-backdrop modal-backdrop-open"><div class="loader" role="status"><span class="visually-hidden">Loading...</span></div></div>',
        )
        overlay = document.body.lastElementChild
    }
}

/**
 * @param {string|symbol} owner
 */
export function hideLoader(owner) {
    if (!owners.delete(owner)) {
        return
    }

    setBodyLock(BODY_LOCK_CLASS, owner, false)

    if (owners.size === 0 && overlay) {
        overlay.remove()
        overlay = null
    }
}
