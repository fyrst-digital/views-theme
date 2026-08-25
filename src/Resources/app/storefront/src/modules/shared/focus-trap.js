/**
 * Tab-cycle focus inside a dialog root.
 *
 * @module @views-theme/modules/shared/focus-trap
 */

/**
 * @param {KeyboardEvent} event
 * @param {Element} root
 */
export function trapFocus(event, root) {
    if (!(event instanceof KeyboardEvent) || event.key !== 'Tab' || !root) {
        return
    }

    const fh = window.focusHandler
    if (!fh?.getFocusableElements || !fh?.setFocus) {
        return
    }

    const focusables = Array.from(fh.getFocusableElements(root))

    if (!focusables.length) {
        event.preventDefault()
        return
    }

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (event.shiftKey) {
        if (active === first || !root.contains(active)) {
            event.preventDefault()
            fh.setFocus(last, { focusVisible: true })
        }
        return
    }

    if (active === last || !root.contains(active)) {
        event.preventDefault()
        fh.setFocus(first, { focusVisible: true })
    }
}
