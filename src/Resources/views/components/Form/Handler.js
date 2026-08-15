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
        this._associated = this._fields().filter((field) => !this.el.contains(field))
        this._associated.forEach((field) => {
            field.addEventListener('input', this._onInput)
            field.addEventListener('change', this._onInput)
        })
        this._syncConfirmValidity()
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
        this.el.removeEventListener('input', this._onInput)
        this.el.removeEventListener('change', this._onInput)
        this._associated?.forEach((field) => {
            field.removeEventListener('input', this._onInput)
            field.removeEventListener('change', this._onInput)
        })
    }

    /**
     * @param {boolean} submitting
     */
    setSubmitting(submitting) {
        const buttons = new Set([
            ...this.el.querySelectorAll('button[type="submit"]'),
            ...this._fields().filter((el) => el instanceof HTMLButtonElement && el.type === 'submit'),
        ])
        buttons.forEach((button) => {
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

        this._syncConfirmValidity()

        if (!this.el.checkValidity()) {
            event.preventDefault()
            this._syncInvalidChrome()
            this.el.reportValidity()
            return
        }

        this.setSubmitting(true)
        window.Shopware.emit(this.options.submitEvent, { el: this.el, form: this.el })

        if (this.options.preventNative) {
            event.preventDefault()
        }
    }

    /**
     * @param {Event} event
     */
    _onInput(event) {
        const field = event.target
        if (!(field instanceof HTMLElement) || field.form !== this.el) {
            return
        }
        if (!isFormControl(field)) {
            return
        }

        this._syncConfirmValidity()
        setInvalidChrome(field, !field.checkValidity())
    }

    /**
     * @returns {Array<Element>}
     */
    _fields() {
        return Array.from(this.el.elements)
    }

    _syncConfirmValidity() {
        this._fields().forEach((field) => {
            if (!isFormControl(field) || !field.hasAttribute('data-confirm-for')) {
                return
            }
            const otherId = field.getAttribute('data-confirm-for')
            const other = otherId ? document.getElementById(otherId) : null
            if (!isFormControl(other)) {
                field.setCustomValidity('')
                return
            }

            const message = field.getAttribute('data-confirm-message') || field.validationMessage || ' '
            field.setCustomValidity(field.value === other.value ? '' : message)
        })
    }

    _syncInvalidChrome() {
        this._fields().forEach((field) => {
            if (isFormControl(field)) {
                setInvalidChrome(field, !field.checkValidity())
            }
        })
    }
}
