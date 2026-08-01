export default class FilterActive extends ShopwareComponent {
    static options = {
        listingComponent: 'ViewsTheme:Product:Listing',
        changedEvent: 'ViewsTheme:Listing:Changed',
        resetAllLabel: 'Reset all',
        removeLabel: 'Remove filter',
    }

    init() {
        this._list = this.el.querySelector('[data-active-list]')
        this._chipTemplate = this.el.querySelector('[data-active-chip-template]')
        this._resetTemplate = this.el.querySelector('[data-active-reset-template]')
        this._onChanged = this._onChanged.bind(this)
        this._onClick = this._onClick.bind(this)
        window.Shopware.on(this.options.changedEvent, this._onChanged)
        this.el.addEventListener('click', this._onClick)
        this._render()
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onChanged)
        this.el.removeEventListener('click', this._onClick)
    }

    _onChanged(payload) {
        if (payload && payload.ok === false) {
            return
        }
        this._render()
    }

    _onClick(event) {
        const target = event.target instanceof Element
            ? event.target.closest('[data-filter-id], [data-reset-all]')
            : null
        if (!target || !this.el.contains(target)) {
            return
        }

        event.preventDefault()

        if (target.hasAttribute('data-reset-all')) {
            window.Shopware.callMethod(this.options.listingComponent, 'resetAll')
            return
        }

        const id = target.getAttribute('data-filter-id')
        if (id) {
            window.Shopware.callMethod(this.options.listingComponent, 'reset', id)
        }
    }

    _render() {
        if (!this._list || !this._chipTemplate) {
            return
        }

        this._list.replaceChildren()

        const labels = window.Shopware.callMethod(this.options.listingComponent, 'getActiveLabels') || []
        if (!labels.length) {
            return
        }

        labels.forEach((item) => {
            const node = this._chipTemplate.content.cloneNode(true)
            const button = node.querySelector('[data-filter-id]')
            const labelEl = node.querySelector('[data-active-chip-label]')
            if (button) {
                button.setAttribute('data-filter-id', item.id)
                button.setAttribute(
                    'aria-label',
                    `${this.options.removeLabel}: ${item.label}`,
                )
            }
            if (labelEl) {
                labelEl.textContent = item.label
            }
            this._list.appendChild(node)
        })

        if (this._resetTemplate) {
            this._list.appendChild(this._resetTemplate.content.cloneNode(true))
        }
    }
}
