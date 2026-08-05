export default class FilterActive extends ShopwareComponent {
    static options = {
        listingComponent: 'ViewsTheme:Product:Listing',
        changedEvent: 'ViewsTheme:Listing:Changed',
        syncedEvent: 'ViewsTheme:Listing:ControlsSynced',
        resetAllLabel: 'Reset all',
        removeLabel: 'Remove filter',
    }

    init() {
        this._chipTemplate = this.el.querySelector('[data-active-chip-template]')
        this._resetTemplate = this.el.querySelector('[data-active-reset-template]')
        this._onChanged = this._onChanged.bind(this)
        this._onClick = this._onClick.bind(this)
        window.Shopware.on(this.options.changedEvent, this._onChanged)
        window.Shopware.on(this.options.syncedEvent, this._onChanged)
        this.el.addEventListener('click', this._onClick)
        this._render()
        // Listing may hydrate after Active mounts (DOM order / drawer mount).
        requestAnimationFrame(() => {
            this._render()
        })
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onChanged)
        window.Shopware.off(this.options.syncedEvent, this._onChanged)
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

    /**
     * callMethod discards return values — resolve Listing and call getActiveLabels directly.
     */
    _listing() {
        if (!window.Shopware?.getComponentInstanceByElement) {
            return null
        }

        const el = document.querySelector(
            `[data-component="${this.options.listingComponent}"]`,
        )
        if (!el) {
            return null
        }

        return window.Shopware.getComponentInstanceByElement(
            this.options.listingComponent,
            el,
        )
    }

    _clearLive() {
        this.el.querySelectorAll(':scope > :not(template)').forEach((node) => {
            node.remove()
        })
    }

    _render() {
        if (!this._chipTemplate) {
            return
        }

        this._clearLive()

        const listing = this._listing()
        const labels = typeof listing?.getActiveLabels === 'function'
            ? (listing.getActiveLabels() || [])
            : []
        if (!labels.length) {
            this.el.hidden = true
            return
        }

        this.el.hidden = false

        labels.forEach((item) => {
            const node = this._chipTemplate.content.cloneNode(true)
            const button = node.querySelector('[data-filter-id]')
            const labelEl = node.querySelector('[data-active-chip-label]')
            const swatch = node.querySelector('[data-active-chip-swatch]')
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
            this._paintSwatch(swatch, item)
            this.el.appendChild(node)
        })

        if (this._resetTemplate) {
            this.el.appendChild(this._resetTemplate.content.cloneNode(true))
        }
    }

    /**
     * Prefer image over hex (same order as Filter:Chip). Style only — no HTML inject.
     */
    _paintSwatch(swatch, item) {
        if (!swatch) {
            return
        }

        const image = typeof item?.previewImageUrl === 'string' ? item.previewImageUrl.trim() : ''
        const hex = typeof item?.previewHex === 'string' ? item.previewHex.trim() : ''

        if (image) {
            swatch.hidden = false
            swatch.style.backgroundImage = `url("${image.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`
            swatch.style.backgroundColor = ''
            return
        }

        if (hex) {
            swatch.hidden = false
            swatch.style.backgroundImage = ''
            swatch.style.backgroundColor = hex
            return
        }

        swatch.hidden = true
        swatch.removeAttribute('style')
    }
}
