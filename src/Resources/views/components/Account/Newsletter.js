/**
 * Overview newsletter — native change → submit (replaces FormAutoSubmit).
 *
 * @extends {ShopwareComponent}
 */
export default class AccountNewsletter extends ShopwareComponent {
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
        if (!(field instanceof HTMLInputElement) || field.type !== 'checkbox') {
            return
        }
        if (!this.el.contains(field)) {
            return
        }

        const form = field.form || this.el.querySelector('form')
        form?.submit()
    }
}
