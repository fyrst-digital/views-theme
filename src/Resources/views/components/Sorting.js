export default class Sorting extends ShopwareComponent {
    static options = {
        listingComponent: 'ViewsTheme:Product:Listing',
        listingSelector: '[data-component="ViewsTheme:Product:Listing"]',
    }

    init() {
        this._select = this.el.querySelector('select')
        this._onChange = this._onChange.bind(this)

        if (this._select) {
            this._select.addEventListener('change', this._onChange)
        }
    }

    destroy() {
        if (this._select) {
            this._select.removeEventListener('change', this._onChange)
        }
    }

    getValues() {
        if (!this._select || !this._select.value) {
            return {}
        }

        return { order: this._select.value }
    }

    getParamKeys() {
        return ['order']
    }

    getLabels() {
        return []
    }

    reset() {}

    resetAll() {}

    setFromUrl(params) {
        if (!this._select || !params?.order) {
            return
        }

        this._select.value = params.order
    }

    _onChange() {
        if (!document.querySelector(this.options.listingSelector)) {
            return
        }

        window.Shopware.callMethod(
            this.options.listingComponent,
            'apply',
            { order: this._select.value, p: 1 },
            { resetPage: false },
        )
    }
}
