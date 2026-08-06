/**
 * @extends {ShopwareComponent}
 */
export default class Backdrop extends ShopwareComponent {
    static options = {
        componentName: null,
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    _onClick(event) {
        event.preventDefault()
        window.Shopware.callMethod(this.options.componentName, 'close')
    }
}
