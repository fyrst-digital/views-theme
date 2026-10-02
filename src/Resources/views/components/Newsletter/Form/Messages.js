import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

const TYPES = ['success', 'info', 'warning', 'danger']

/**
 * Renders newsletter route `{ type, alert }` items as theme alerts.
 *
 * @extends {ShopwareComponent}
 */
export default class NewsletterFormMessages extends ShopwareComponent {
    static options = {
        sampleComponent: 'ViewsTheme:Newsletter:Form:Messages:Sample',
    }

    /**
     * @param {Array<{ type?: string, alert?: string }>} items
     */
    show(items) {
        this._clear()
        ;(Array.isArray(items) ? items : []).forEach((item) => {
            const texts = this._texts(item?.alert)
            if (!texts.length) {
                return
            }

            const node = this._clone(this._type(item?.type))
            if (!node) {
                return
            }

            this._fill(node, texts)
            this.el.append(node)
        })
    }

    _clear() {
        this.el.querySelectorAll('[role="alert"]').forEach((node) => {
            node.remove()
        })
    }

    /**
     * @param {string} type
     * @returns {Element|null}
     */
    _clone(type) {
        const sample = this._sample(type) || this._sample('info')
        if (!(sample instanceof HTMLTemplateElement)) {
            return null
        }

        return sample.content.cloneNode(true).firstElementChild
    }

    /**
     * @param {string} type
     * @returns {Element|null}
     */
    _sample(type) {
        const name = this.options.sampleComponent
        const nodes = this.el.querySelectorAll(`[data-component="${name}"]`)
        for (const node of nodes) {
            if (this._sampleType(node) === type) {
                return node
            }
        }

        return null
    }

    /**
     * @param {Element} node
     * @returns {string|null}
     */
    _sampleType(node) {
        const instance = getInstanceByElement(this.options.sampleComponent, node)
        if (typeof instance?.options?.type === 'string') {
            return instance.options.type
        }

        const raw = node.getAttribute('data-component-options')
        if (!raw) {
            return null
        }

        try {
            const parsed = JSON.parse(raw)
            return typeof parsed?.type === 'string' ? parsed.type : null
        } catch {
            return null
        }
    }

    /**
     * @param {string|undefined} type
     * @returns {string}
     */
    _type(type) {
        if (type === 'error') {
            return 'danger'
        }
        if (TYPES.includes(type)) {
            return type
        }

        return 'info'
    }

    /**
     * Plain text stays as one message. HTML alerts (core `alert.html.twig`)
     * become their list items, or the element's text when there is no list.
     *
     * @param {unknown} alert
     * @returns {string[]}
     */
    _texts(alert) {
        const value = String(alert ?? '').trim()
        if (value === '') {
            return []
        }
        if (!value.startsWith('<')) {
            return [value]
        }

        const doc = new DOMParser().parseFromString(value, 'text/html')
        const items = [...doc.querySelectorAll('li')]
            .map((item) => item.textContent.trim())
            .filter(Boolean)
        if (items.length) {
            return items
        }

        const text = doc.body.textContent.trim()
        return text ? [text] : []
    }

    /**
     * @param {Element} alert
     * @param {string[]} texts
     */
    _fill(alert, texts) {
        const paragraph = alert.querySelector('p')
        const list = alert.querySelector('ul')
        if (texts.length > 1 && list) {
            paragraph?.remove()
            const item = list.querySelector('li')
            list.replaceChildren()
            texts.forEach((text) => {
                const li = item ? item.cloneNode(false) : document.createElement('li')
                li.textContent = text
                list.append(li)
            })
            list.hidden = false
            return
        }

        list?.remove()
        if (paragraph) {
            paragraph.textContent = texts[0] || ''
        }
    }
}
