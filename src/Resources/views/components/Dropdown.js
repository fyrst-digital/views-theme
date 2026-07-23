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
            return
        }

        if (this._toggle && this._panel?.contains(document.activeElement)) {
            this._setFocus(this._toggle)
        }
    }
}
