import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class Dropdown extends ThemeComponent {
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
        this.scope.on(this._panel, 'toggle', this._onToggle)

        if (this._host.classList.contains(this.options.lgUpHostClass)) {
            this._mql = window.matchMedia(this.options.lgUpMedia)
            this._onMql = this._closeIfBelowLg.bind(this)
            this.scope.on(this._mql, 'change', this._onMql)
        }
    }

    destroy() {
        this._host = null
        this._panel = null
        this._toggle = null
        this._onToggle = null
        this._mql = null
        this._onMql = null

        super.destroy()
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
