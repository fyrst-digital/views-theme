import { fetchText } from '@views-theme/modules/shared/http.js'
import { parseHtmlFragment } from '@views-theme/modules/shared/dom.js'

/**
 * Overview newsletter — checkbox change → XHR POST (replaces FormAutoSubmit). The widget route
 * answers with the re-rendered component, which replaces this root (new switch state + messages).
 *
 * @extends {ShopwareComponent}
 */
export default class AccountNewsletter extends ShopwareComponent {
    static options = {
        componentName: 'ViewsTheme:Account:Newsletter',
    }

    init() {
        this._busy = false
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
        if (form) {
            this._submit(form, field)
        }
    }

    /**
     * @param {HTMLFormElement} form
     * @param {HTMLInputElement} field
     */
    async _submit(form, field) {
        if (this._busy) {
            field.checked = !field.checked
            return
        }

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            const html = await fetchText(form.action, {
                method: form.method || 'POST',
                body: new FormData(form),
            })
            const next = parseHtmlFragment(html).querySelector(
                `[data-component="${this.options.componentName}"]`,
            )
            if (!next) {
                throw new Error('Newsletter response has no component root')
            }

            this.el.replaceWith(next)
            next.querySelector('input[type="checkbox"]')?.focus()
        } catch (error) {
            console.error('ViewsTheme:Account:Newsletter submit failed', error)
            field.checked = !field.checked
            this._busy = false
            this.el.removeAttribute('aria-busy')
        }
    }
}
