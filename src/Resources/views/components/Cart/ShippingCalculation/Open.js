/**
 * @extends {ShopwareComponent}
 */
export default class CartShippingCalculationOpen extends ShopwareComponent {
    static options = {
        shippingCalculationComponentName: 'ViewsTheme:Cart:ShippingCalculation',
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
        window.Shopware.callMethod(this.options.shippingCalculationComponentName, 'toggle')
    }
}
