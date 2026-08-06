/**
 * @extends {ShopwareComponent}
 */
export default class CartDrawerActionBadge extends ShopwareComponent {
    static options = {
        changedEvent: 'ViewsTheme:Cart:Changed',
    }

    init() {
        this._onCartChanged = this._onCartChanged.bind(this)
        window.Shopware.on(this.options.changedEvent, this._onCartChanged)
        this._render(window.cartCount || 0)
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onCartChanged)
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
