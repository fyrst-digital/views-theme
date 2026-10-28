import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class CartDrawerActionBadge extends ThemeComponent {
    static options = {
        changedEvent: 'ViewsTheme:Cart:Changed',
    }

    init() {
        this._onCartChanged = this._onCartChanged.bind(this)
        this.scope.bus(this.options.changedEvent, this._onCartChanged)
        this._render(window.cartCount || 0)
    }

    _onCartChanged(payload) {
        if (!payload || typeof payload.count !== 'number') {
            return
        }

        window.cartCount = payload.count
        this._render(payload.count)
    }

    _render(count) {
        if (count > 0) {
            this.el.hidden = false
            this.el.textContent = String(count)
        } else {
            this.el.hidden = true
            this.el.textContent = ''
        }
    }
}
