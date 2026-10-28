import { resetFilters } from '@views-theme/modules/listing/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Placement-independent filter reset. `keys` null clears every facet.
 *
 * @extends {ThemeComponent}
 */
export default class FilterReset extends ThemeComponent {
    static options = {
        keys: null,
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    /**
     * @param {Event} event
     */
    _onClick(event) {
        event.preventDefault()
        resetFilters(this.options.keys ?? null)
    }
}
