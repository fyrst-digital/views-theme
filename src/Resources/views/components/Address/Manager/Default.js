import { manager } from '@views-theme/modules/address/manager.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class AddressManagerDefault extends ThemeComponent {
    static options = {
        addressId: null,
        type: 'shipping',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        event.preventDefault()
        manager.call('setDefault', this.options.addressId, this.options.type)
    }
}
