import { getCookie } from '@views-theme/modules/cookie/storage.js'

/**
 * One cookie group of the manager: preselects the cookies that are set and keeps the group switch
 * (`input[name="group"]`) in sync with its cookies (`input[name="cookie"]`): checked when any is
 * on, indeterminate when only some are.
 *
 * @extends {ShopwareComponent}
 */
export default class CookieManagerGroup extends ShopwareComponent {
    init() {
        this._onChange = this._onChange.bind(this)

        this._master = this.el.querySelector('input[name="group"]')
        this._cookies = [...this.el.querySelectorAll('input[name="cookie"]')]

        this._cookies.forEach((input) => {
            if (!input.disabled) {
                input.checked = Boolean(getCookie(input.value))
            }
        })

        this._syncMaster()
        this.el.addEventListener('change', this._onChange)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
    }

    /**
     * @param {Event} event
     */
    _onChange(event) {
        if (event.target === this._master) {
            this._cookies.forEach((input) => {
                if (!input.disabled) {
                    input.checked = this._master.checked
                }
            })
            this._master.indeterminate = false
            return
        }

        this._syncMaster()
    }

    _syncMaster() {
        if (!this._master || this._master.disabled) {
            return
        }

        const on = this._cookies.filter((input) => input.checked).length

        this._master.checked = on > 0
        this._master.indeterminate = on > 0 && on < this._cookies.length
    }
}
