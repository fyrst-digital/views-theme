import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Footer close — Modal.close via callMethod.
 *
 * @extends {ThemeComponent}
 */
export default class AddressManagerDismiss extends ThemeComponent {
    static options = {
        modalComponentName: 'ViewsTheme:Modal',
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
        window.Shopware.callMethod(this.options.modalComponentName, 'close')
    }
}
