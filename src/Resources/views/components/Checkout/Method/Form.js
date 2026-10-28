import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Payment / shipping configure form — native change → submit.
 *
 * @extends {ThemeComponent}
 */
export default class CheckoutMethodForm extends ThemeComponent {
    init() {
        this._onChange = this._onChange.bind(this)
        this.scope.on(this.el, 'change', this._onChange)
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

        this.el.requestSubmit()
    }
}
