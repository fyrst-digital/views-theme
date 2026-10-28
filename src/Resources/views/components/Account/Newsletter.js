import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Overview newsletter — native change → submit (replaces FormAutoSubmit).
 *
 * @extends {ThemeComponent}
 */
export default class AccountNewsletter extends ThemeComponent {
    init() {
        this._onChange = this._onChange.bind(this)
        this.scope.on(this.el, 'change', this._onChange)
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
        form?.requestSubmit()
    }
}
