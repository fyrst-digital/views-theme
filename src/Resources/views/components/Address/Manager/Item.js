import { selectAddress, selection } from '@views-theme/modules/address/selection.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Selectable address row. One `Form:Selection` radio that follows the selection signal.
 *
 * @extends {ThemeComponent}
 */
export default class AddressManagerItem extends ThemeComponent {
    static options = {
        addressId: null,
        type: 'shipping',
        disabled: false,
        editComponent: 'ViewsTheme:Address:Manager:Edit',
        defaultComponent: 'ViewsTheme:Address:Manager:Default',
    }

    init() {
        this._radio = this.el.querySelector('input[type="radio"]')
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)

        if (this.options.disabled || !this._radio) {
            return
        }

        // Claim the server-rendered choice first, then follow the signal.
        if (this._radio.checked) {
            selectAddress(this.options.type, this.options.addressId)
        }
        this.scope.effect(selection, (value) => {
            this._radio.checked = value[this.options.type] === this.options.addressId
        })
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        const action = event.target.closest(
            `[data-component="${this.options.editComponent}"], [data-component="${this.options.defaultComponent}"]`,
        )
        if (action && this.el.contains(action)) {
            event.preventDefault()
            return
        }

        if (this.options.disabled) {
            return
        }

        selectAddress(this.options.type, this.options.addressId)
    }
}
