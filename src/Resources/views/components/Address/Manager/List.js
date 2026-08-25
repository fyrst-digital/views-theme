import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Available-address list — client-side search filter.
 *
 * @extends {ShopwareComponent}
 */
export default class AddressManagerList extends ShopwareComponent {
    static options = {
        itemComponent: 'ViewsTheme:Address:Manager:Item',
        statusComponent: 'ViewsTheme:Address:Manager:Status',
    }

    init() {
        this._onInput = this._onInput.bind(this)
        this.el.addEventListener('input', this._onInput)
        this._sync('')
    }

    destroy() {
        this.el.removeEventListener('input', this._onInput)
    }

    /**
     * @param {Event} event
     */
    _onInput(event) {
        const field = event.target
        if (!(field instanceof HTMLInputElement) || field.type !== 'search') {
            return
        }

        this._sync(field.value)
    }

    /**
     * @param {string} query
     */
    _sync(query) {
        const term = String(query || '').trim().toLowerCase()
        const items = Array.from(
            this.el.querySelectorAll(`[data-component="${this.options.itemComponent}"]`),
        )

        let visible = 0
        for (const item of items) {
            const match = term === '' || (item.textContent || '').toLowerCase().includes(term)
            item.hidden = !match
            if (match) {
                visible += 1
            }
        }

        const total = items.length
        const statuses = this.el.querySelectorAll(
            `[data-component="${this.options.statusComponent}"]`,
        )

        statuses.forEach((el) => {
            let kind = getInstanceByElement(this.options.statusComponent, el)?.options?.kind
            if (!kind) {
                try {
                    kind = JSON.parse(el.getAttribute('data-component-options') || '{}').kind
                } catch {
                    kind = null
                }
            }
            if (kind === 'empty') {
                el.hidden = total !== 0
            }
            if (kind === 'notFound') {
                el.hidden = !(term !== '' && visible === 0 && total > 0)
            }
        })
    }
}
