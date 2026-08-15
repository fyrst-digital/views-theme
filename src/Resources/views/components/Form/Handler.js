import { isFormControl, setInvalidChrome } from '@views-theme/modules/shared/form.js'

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
     * @param {boolean} submitting
     */
    setSubmitting(submitting) {
        this.el.querySelectorAll('button[type="submit"]').forEach((button) => {
            button.disabled = submitting
            if (submitting) {
                button.setAttribute('aria-busy', 'true')
            } else {
                button.removeAttribute('aria-busy')
            }
        })
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

        this.setSubmitting(true)
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
        if (!isFormControl(field)) {
            return
        }

        this._syncConfirmValidity()
        setInvalidChrome(field, !field.checkValidity())
    }

    _syncConfirmValidity() {
        this.el.querySelectorAll('[data-confirm-for]').forEach((field) => {
            if (!isFormControl(field)) {
                return
            }
            const otherId = field.getAttribute('data-confirm-for')
            const other = otherId ? this.el.querySelector(`#${CSS.escape(otherId)}`) : null
            if (!isFormControl(other)) {
                field.setCustomValidity('')
                return
            }

            const message = field.getAttribute('data-confirm-message') || field.validationMessage || ' '
            field.setCustomValidity(field.value === other.value ? '' : message)
        })
    }

    _syncInvalidChrome() {
        this.el.querySelectorAll('input, select, textarea').forEach((field) => {
            if (isFormControl(field)) {
                setInvalidChrome(field, !field.checkValidity())
            }
        })
    }
}
