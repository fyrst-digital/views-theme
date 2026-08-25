/**
 * Footer close — Modal.close via callMethod.
 *
 * @extends {ShopwareComponent}
 */
export default class AddressManagerDismiss extends ShopwareComponent {
    static options = {
        modalComponentName: 'ViewsTheme:Modal',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        event.preventDefault()
        window.Shopware.callMethod(this.options.modalComponentName, 'close')
    }
}
