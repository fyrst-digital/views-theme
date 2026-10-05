import { resetListing } from '@views-theme/modules/listing/apply.js'

/**
 * Placement-independent filter reset. `keys` null clears every facet.
 *
 * @extends {ShopwareComponent}
 */
export default class FilterReset extends ShopwareComponent {
    static options = {
        keys: null,
        listingComponent: 'ViewsTheme:Product:Listing',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    /**
     * @param {Event} event
     */
    _onClick(event) {
        event.preventDefault()
        resetListing(this.options.listingComponent, this.options.keys ?? null)
    }
}
