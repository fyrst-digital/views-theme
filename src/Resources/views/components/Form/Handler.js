/**
 * Form owner — Constraint Validation, confirmFor match, submit loading.
 *
 * @extends {ShopwareComponent}
 */
export default class FormHandler extends ShopwareComponent {
    static options = {
        preventNative: false,
        submitEvent: 'ViewsTheme:Form:Handler:Submit',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this._onInput = this._onInput.bind(this)
        this.el.addEventListener('submit', this._onSubmit)
        this.el.addEventListener('input', this._onInput)
        this.el.addEventListener('change', this._onInput)
        this._syncConfirmValidity()
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
        this.el.removeEventListener('input', this._onInput)
        this.el.removeEventListener('change', this._onInput)
    }

    /**
     * @param {SubmitEvent} event
     */
    _onSubmit(event) {
        if (!(event.target instanceof HTMLFormElement) || event.target !== this.el) {
            return
        }

        event.preventDefault()
        this._syncConfirmValidity()

        if (!this.el.checkValidity()) {
            this._syncInvalidChrome()
            this.el.reportValidity()
            return
        }

        this._setSubmitting(true)
        window.Shopware.emit(this.options.submitEvent, { el: this.el, form: this.el })

        if (!this.options.preventNative) {
            HTMLFormElement.prototype.submit.call(this.el)
        }
    }

    /**
     * @param {Event} event
     */
    _onInput(event) {
        const field = event.target
        if (!(field instanceof HTMLElement) || !this.el.contains(field)) {
            return
        }
        if (!field.matches('input, select, textarea')) {
            return
        }

        this._syncConfirmValidity()
        this._syncFieldChrome(field)
    }

    _syncConfirmValidity() {
        this.el.querySelectorAll('[data-confirm-for]').forEach((field) => {
            if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
                return
            }
            const otherId = field.getAttribute('data-confirm-for')
            const other = otherId ? this.el.querySelector(`#${CSS.escape(otherId)}`) : null
            if (!(other instanceof HTMLInputElement || other instanceof HTMLSelectElement || other instanceof HTMLTextAreaElement)) {
                field.setCustomValidity('')
                return
            }

            const message = field.getAttribute('data-confirm-message') || field.validationMessage || ' '
            field.setCustomValidity(field.value === other.value ? '' : message)
        })
    }

    _syncInvalidChrome() {
        this.el.querySelectorAll('input, select, textarea').forEach((field) => {
            this._syncFieldChrome(field)
        })
    }

    /**
     * @param {Element} field
     */
    _syncFieldChrome(field) {
        if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
            return
        }
        if (field.disabled) {
            return
        }

        const invalid = !field.checkValidity()
        field.classList.toggle('is-invalid', invalid)
        if (invalid) {
            field.setAttribute('aria-invalid', 'true')
        } else {
            field.removeAttribute('aria-invalid')
        }
    }

    /**
     * @param {boolean} submitting
     */
    _setSubmitting(submitting) {
        this.el.querySelectorAll('button[type="submit"]').forEach((button) => {
            button.disabled = submitting
            if (submitting) {
                button.setAttribute('aria-busy', 'true')
            } else {
                button.removeAttribute('aria-busy')
            }
        })
    }
}
