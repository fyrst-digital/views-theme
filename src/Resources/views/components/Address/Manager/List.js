import { applyAddressFilter, dropAddressFilter } from '@views-theme/modules/address/filter.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Available-address list — client-side search filter.
 *
 * @extends {ThemeComponent}
 */
export default class AddressManagerList extends ThemeComponent {
    static options = {
        listId: null,
        itemComponent: 'ViewsTheme:Address:Manager:Item',
    }

    init() {
        this._onInput = this._onInput.bind(this)
        this.scope.on(this.el, 'input', this._onInput)
        this._sync('')
    }

    destroy() {
        dropAddressFilter(this.options.listId)

        super.destroy()
    }

    /**
     * @param {Event} event
     */
    _onInput(event) {
        const field = event.target
        if (!(field instanceof HTMLInputElement) || field.type !== 'search') {
            return
        }

        this._sync(field.value)
    }

    /**
     * @param {string} query
     */
    _sync(query) {
        applyAddressFilter(
            this.options.listId,
            this.el.querySelectorAll(`[data-component="${this.options.itemComponent}"]`),
            query,
        )
    }
}
