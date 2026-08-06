/**
 * @extends {ShopwareComponent}
 */
export default class FilterPanel extends ShopwareComponent {
    static options = {
        loadingEvent: 'ViewsTheme:Listing:Loading',
    }

    init() {
        this._onLoading = this._onLoading.bind(this)
        window.Shopware.on(this.options.loadingEvent, this._onLoading)
    }

    destroy() {
        window.Shopware.off(this.options.loadingEvent, this._onLoading)
    }

    _onLoading(payload) {
        this.el.setAttribute('aria-busy', payload?.busy ? 'true' : 'false')
    }
}
