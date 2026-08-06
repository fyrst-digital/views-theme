/**
 * @extends {ShopwareComponent}
 */
export default class LineItemRemove extends ShopwareComponent {
    static options = {
        lineItemId: null,
        removeEvent: 'ViewsTheme:Cart:Remove',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this.el.addEventListener('submit', this._onSubmit)
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
    }

    _onSubmit(event) {
        event.preventDefault()

        if (!this.options.lineItemId) {
            return
        }

        window.Shopware.emit(this.options.removeEvent, {
            lineItemId: this.options.lineItemId,
            source: this.el,
        })
    }
}
