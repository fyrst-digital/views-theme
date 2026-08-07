import { applyListing } from '@views-theme/modules/listing/apply.js'
import { applyReview } from '@views-theme/modules/review/apply.js'

/**
 * Pagination page link → owner.apply({ p }).
 *
 * @extends {ShopwareComponent}
 */
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
        const owner = this.options.listingComponent || 'ViewsTheme:Product:Listing'

        if (owner === 'ViewsTheme:Review:Panel') {
            applyReview(
                { p: page },
                {
                    panelComponent: owner,
                    callOptions: { resetPage: false },
                },
            )
            return
        }

        applyListing(
            { p: page },
            {
                listingComponent: owner,
                callOptions: { resetPage: false },
            },
        )
    }
}
