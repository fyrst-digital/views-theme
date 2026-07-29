export default class WishlistActionBadge extends ShopwareComponent {
    static options = {
        changedEvent: 'ViewsTheme:Wishlist:Changed',
        liveId: null,
        liveText: '%counter%',
    }

    init() {
        this._onChanged = this._onChanged.bind(this)
        window.Shopware.on(this.options.changedEvent, this._onChanged)
        this._render(window.wishlistCount || 0)
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onChanged)
    }

    _onChanged(payload) {
        if (!payload || typeof payload.count !== 'number') {
            return
        }

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

        this._updateLiveArea(count)
    }

    _updateLiveArea(count) {
        if (!this.options.liveId) {
            return
        }

        const live = document.getElementById(this.options.liveId)
        if (!live) {
            return
        }

        const template = this.options.liveText || '%counter%'
        live.textContent = template.replace('%counter%', String(count || 0))
    }
}
