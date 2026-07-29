export default class ProductActionBuy extends ShopwareComponent {
    static options = {
        addEvent: 'ViewsTheme:Cart:Add',
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

        const formData = new FormData(this.el)

        window.Shopware.emit(this.options.addEvent, {
            formData,
            source: this.el,
        })
    }
}
