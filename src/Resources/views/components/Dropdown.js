export default class Dropdown extends ShopwareComponent {
    static options = {
        lgUpMedia: '(max-width: 1023.98px)',
        lgUpHostClass: 'vi-dropdown-host--lg-up',
    }

    init() {
        this._host = this.el
        this._panel = this._host.querySelector('[popover]')
        this._toggle = this._host.querySelector('[popovertarget]')

        if (!this._panel?.id || !this._toggle) {
            return
        }

        this._onToggle = this._handleToggle.bind(this)
        this._panel.addEventListener('toggle', this._onToggle)

        if (this._host.classList.contains(this.options.lgUpHostClass)) {
            this._mql = window.matchMedia(this.options.lgUpMedia)
            this._onMql = this._closeIfBelowLg.bind(this)
            this._mql.addEventListener('change', this._onMql)
        }
    }

    destroy() {
        this._panel?.removeEventListener('toggle', this._onToggle)
        this._mql?.removeEventListener('change', this._onMql)
        this._host = null
        this._panel = null
        this._toggle = null
        this._onToggle = null
        this._mql = null
        this._onMql = null
    }

    _handleToggle(event) {
        const open = event.newState === 'open'
        this._toggle?.setAttribute('aria-expanded', open ? 'true' : 'false')
    }

    _closeIfBelowLg() {
        if (!this._mql?.matches || !this._panel?.matches(':popover-open')) {
            return
        }

        this._panel.hidePopover()
    }
}
