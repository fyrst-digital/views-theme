export default class Dropdown extends ShopwareComponent {
    init() {
        this._panel = this.el
        if (!this._panel?.id) {
            return
        }

        this._toggle = document.querySelector(
            `[popovertarget="${CSS.escape(this._panel.id)}"]`,
        )
        this._onToggle = this._handleToggle.bind(this)
        this._panel.addEventListener('toggle', this._onToggle)
    }

    destroy() {
        this._panel?.removeEventListener('toggle', this._onToggle)
        this._panel = null
        this._toggle = null
        this._onToggle = null
    }

    _handleToggle(event) {
        const open = event.newState === 'open'
        this._toggle?.setAttribute('aria-expanded', open ? 'true' : 'false')

        if (open) {
            this._focusPanel()
            return
        }

        if (this._toggle && this._panel?.contains(document.activeElement)) {
            this._setFocus(this._toggle)
        }
    }

    _focusPanel() {
        if (!this._panel) {
            return
        }

        const focusables = this._getFocusableElements(this._panel)
        this._setFocus(focusables[0] || this._panel)
    }

    _getFocusableElements(root) {
        if (window.focusHandler?.getFocusableElements) {
            return Array.from(window.focusHandler.getFocusableElements(root))
        }

        return Array.from(
            root.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
        )
    }

    _setFocus(element) {
        if (!element) {
            return
        }

        if (window.focusHandler?.setFocus) {
            window.focusHandler.setFocus(element, { focusVisible: true })
            return
        }

        element.focus()
    }
}
