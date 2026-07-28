export default class CartPromotionForm extends ShopwareComponent {
    static options = {
        promoteEvent: 'ViewsTheme:Cart:Promote',
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

        window.Shopware.emit(this.options.promoteEvent, {
            code: formData.get('code'),
            formData,
            source: this.el,
        })
    }
}
