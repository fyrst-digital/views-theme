import { fetchResponse } from '@views-theme/modules/shared/http.js'
import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Core captcha plugins call `form.submit()` after a token check (no second
 * submit event) unless a PluginManager form plugin exposes `sendAjaxFormSubmit`.
 * Honeypot does not take over the submit.
 */
const CAPTCHA_OWNS_SUBMIT = [
    '[data-basic-captcha="true"]',
    '[data-google-re-captcha-v2="true"]',
    '[data-google-re-captcha-v3="true"]',
]

/**
 * Public newsletter subscribe — JSON POST to the core newsletter route.
 *
 * @extends {ShopwareComponent}
 */
export default class NewsletterForm extends ShopwareComponent {
    static options = {
        submitEvent: 'ViewsTheme:Form:Handler:Submit',
        handlerComponent: 'ViewsTheme:Form:Handler',
        messagesComponent: 'ViewsTheme:Newsletter:Form:Messages',
    }

    init() {
        this.form = this.el.querySelector('form')
        this._posting = false
        if (this.form) {
            this.form.submit = () => {
                this._post()
            }
        }
        this._onHandlerSubmit = this._onHandlerSubmit.bind(this)
        window.Shopware.on(this.options.submitEvent, this._onHandlerSubmit)
    }

    destroy() {
        window.Shopware.off(this.options.submitEvent, this._onHandlerSubmit)
        if (this.form && Object.prototype.hasOwnProperty.call(this.form, 'submit')) {
            delete this.form.submit
        }
    }

    /**
     * @param {{ el?: Element, form?: HTMLFormElement }} payload
     */
    _onHandlerSubmit(payload) {
        const form = payload?.form || payload?.el
        if (!(form instanceof HTMLFormElement) || form !== this.form) {
            return
        }
        if (this._captchaOwnsSubmit()) {
            return
        }

        this._post()
    }

    /**
     * @returns {boolean}
     */
    _captchaOwnsSubmit() {
        if (!this.form) {
            return false
        }

        return CAPTCHA_OWNS_SUBMIT.some((selector) => this.form.querySelector(selector))
    }

    async _post() {
        if (!this.form || this._posting) {
            return
        }

        this._posting = true
        const handler = getInstanceByElement(this.options.handlerComponent, this.form)
        handler?.setSubmitting(true)

        try {
            const response = await fetchResponse(this.form.action, {
                method: 'POST',
                body: new FormData(this.form),
            })
            const data = await response.json()
            if (!Array.isArray(data)) {
                return
            }

            this._show(data)
            if (this._shouldReset(data)) {
                this.form.reset()
            }
        } catch {
            // Non-JSON gateway or network failure. The form stays filled.
        } finally {
            this._posting = false
            if (handler?.el && document.contains(handler.el)) {
                handler.setSubmitting(false)
            }
        }
    }

    /**
     * Core FormCmsHandler resets only when every item is success.
     * A persisted subscribe also returns an info alert, so the fields stay.
     *
     * @param {Array<{ type?: string }>} items
     * @returns {boolean}
     */
    _shouldReset(items) {
        return items.length > 0 && items.every((item) => item?.type === 'success')
    }

    /**
     * @param {Array<{ type?: string, alert?: string }>} items
     */
    _show(items) {
        const messages = this.el.querySelector(`[data-component="${this.options.messagesComponent}"]`)
        const instance = getInstanceByElement(this.options.messagesComponent, messages)
        if (typeof instance?.show !== 'function') {
            return
        }

        instance.show(items)
    }
}
