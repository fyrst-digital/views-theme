/**
 * Payment / shipping configure form — native change → submit.
 *
 * @extends {ShopwareComponent}
 */
export default class CheckoutMethodForm extends ShopwareComponent {
    init() {
        this._onChange = this._onChange.bind(this)
        this.el.addEventListener('change', this._onChange)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
    }

    /**
     * @param {Event} event
     */
    _onChange(event) {
        const field = event.target
        if (!(field instanceof HTMLInputElement) || field.type !== 'radio') {
            return
        }
        if (!this.el.contains(field)) {
            return
        }

        this.el.submit()
    }
}
