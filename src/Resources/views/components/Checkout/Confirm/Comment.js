import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Persist customer comment across configure reloads. Never stores TOS.
 *
 * @extends {ThemeComponent}
 */
export default class CheckoutConfirmComment extends ThemeComponent {
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
        this.scope.on(this._field, 'input', this._onInput)
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
