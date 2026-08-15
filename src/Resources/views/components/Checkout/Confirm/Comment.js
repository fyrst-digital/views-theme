/**
 * Persist customer comment across configure reloads. Never stores TOS.
 *
 * @extends {ShopwareComponent}
 */
export default class CheckoutConfirmComment extends ShopwareComponent {
    static options = {
        customerId: null,
        fieldName: 'customerComment',
        storagePrefix: 'views-theme:checkout:comment',
    }

    init() {
        const name = this.options.fieldName
        this._field = name ? this.el.querySelector(`[name="${CSS.escape(name)}"]`) : null
        if (!this._field || !this.options.customerId) {
            return
        }

        this._key = `${this.options.storagePrefix}:${this.options.customerId}`
        this._onInput = this._save.bind(this)
        this._restore()
        this._field.addEventListener('input', this._onInput)
    }

    destroy() {
        if (this._field && this._onInput) {
            this._field.removeEventListener('input', this._onInput)
        }
    }

    _restore() {
        try {
            const value = window.localStorage.getItem(this._key)
            if (value) {
                this._field.value = value
            }
        } catch {
            // private mode / blocked storage
        }
    }

    _save() {
        try {
            const value = this._field.value
            if (value) {
                window.localStorage.setItem(this._key, value)
            } else {
                window.localStorage.removeItem(this._key)
            }
        } catch {
            // private mode / blocked storage
        }
    }
}
