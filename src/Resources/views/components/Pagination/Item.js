export default class PaginationItem extends ShopwareComponent {
    static options = {
        page: 1,
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

    _onClick(event) {
        if (this.el.getAttribute('aria-disabled') === 'true') {
            event.preventDefault()
            return
        }

        if (!document.querySelector(this.options.listingSelector)) {
            return
        }

        event.preventDefault()
        const page = Number(this.options.page || 1)
        window.Shopware.callMethod(
            this.options.listingComponent,
            'apply',
            { p: page },
            { resetPage: false },
        )
    }
}
