import { manager } from '@views-theme/modules/address/manager.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class AddressManagerCreate extends ThemeComponent {
    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        event.preventDefault()
        manager.call('openCreate')
    }
}
