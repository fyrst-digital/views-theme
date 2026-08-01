export default class Pagination extends ShopwareComponent {
    static options = {
        listingComponent: 'ViewsTheme:Product:Listing',
        listingSelector: '[data-component="ViewsTheme:Product:Listing"]',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    getValues() {
        return {}
    }

    getParamKeys() {
        return ['p']
    }

    getLabels() {
        return []
    }

    reset() {}

    resetAll() {}

    setFromUrl() {}

    _onClick(event) {
        const link = event.target instanceof Element
            ? event.target.closest('a[data-page]')
            : null

        if (!link || !this.el.contains(link)) {
            return
        }

        if (link.getAttribute('aria-disabled') === 'true') {
            event.preventDefault()
            return
        }

        if (!document.querySelector(this.options.listingSelector)) {
            return
        }

        event.preventDefault()
        const page = Number(link.getAttribute('data-page') || '1')
        window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: page }, { resetPage: false })
    }
}
