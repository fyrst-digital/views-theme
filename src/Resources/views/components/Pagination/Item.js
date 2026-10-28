import { apply } from '@views-theme/modules/listing/store.js'
import { applyReview, attached as reviewAttached } from '@views-theme/modules/review/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Pagination page link → owner.apply({ p }).
 *
 * @extends {ThemeComponent}
 */
export default class PaginationItem extends ThemeComponent {
    static options = {
        page: 1,
        listingComponent: 'ViewsTheme:Product:Listing',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    _onClick(event) {
        if (this.el.getAttribute('aria-disabled') === 'true') {
            event.preventDefault()
            return
        }

        const page = Number(this.options.page || 1)
        const owner = this.options.listingComponent || 'ViewsTheme:Product:Listing'

        if (owner === 'ViewsTheme:Review:Panel') {
            if (!reviewAttached.get()) {
                return
            }

            event.preventDefault()
            applyReview({ p: page }, { callOptions: { resetPage: false } })
            return
        }

        event.preventDefault()
        apply({ p: page }, { resetPage: false })
    }
}
