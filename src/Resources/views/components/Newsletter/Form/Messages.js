import { newsletterForms } from '@views-theme/modules/newsletter/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

const TYPES = ['success', 'info', 'warning', 'danger']

/**
 * Renders newsletter route `{ type, alert }` items (published by `Newsletter:Form`
 * on the `formId` store) as theme alerts, cloned from its own `<template data-type>` samples.
 *
 * @extends {ThemeComponent}
 */
export default class NewsletterFormMessages extends ThemeComponent {
    static options = {
        formId: null,
    }

    init() {
        /** @type {Map<string, HTMLTemplateElement>} */
        this._samples = new Map()
        this.el.querySelectorAll(':scope > template[data-type]').forEach((template) => {
            this._samples.set(template.dataset.type, template)
        })

        // No replay: only responses after init are shown.
        this.scope.watch(newsletterForms.get(this.options.formId).messages, ({ items }) => this.show(items))
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
        const sample = this._samples.get(type) || this._samples.get('info')

        return sample ? sample.content.cloneNode(true).firstElementChild : null
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
