export default class CartDrawerBody extends ShopwareComponent {
    static options = {
        itemsUrl: null,
        summaryUrl: null,
        headingUrl: null,
        changedEvent: 'ViewsTheme:Cart:Changed',
        headingComponent: 'ViewsTheme:Cart:Drawer:Heading',
        itemsComponent: 'ViewsTheme:Cart:Drawer:Items',
        footerComponent: 'ViewsTheme:Cart:Drawer:Footer',
        drawerSelector: '#vi-cart-drawer',
    }

    init() {
        this._busy = false
        this._onCartChanged = this._onCartChanged.bind(this)
        this._drawerEl = this.el.closest(this.options.drawerSelector) || document.querySelector(this.options.drawerSelector)
        this._alertEl = this.el.querySelector('[role="alert"]')

        window.Shopware.on(this.options.changedEvent, this._onCartChanged)
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onCartChanged)
    }

    async _onCartChanged(payload) {
        if (!payload || payload.ok === false) {
            this._showError(payload?.error)
            return
        }

        this._clearError()
        await this._refreshFragments()
    }

    async _refreshFragments() {
        if (this._busy) {
            return
        }

        const { itemsUrl, summaryUrl, headingUrl } = this.options
        if (!itemsUrl || !summaryUrl || !headingUrl) {
            return
        }

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            const [itemsHtml, summaryHtml, headingHtml] = await Promise.all([
                this._fetchHtml(itemsUrl),
                this._fetchHtml(summaryUrl),
                this._fetchHtml(headingUrl),
            ])

            this._replaceComponent(this.options.itemsComponent, itemsHtml, this.el)
            this._replaceComponent(this.options.footerComponent, summaryHtml, this.el)
            this._replaceComponent(this.options.headingComponent, headingHtml, this._drawerEl || document)
        } catch (error) {
            console.error('CartDrawerBody: Failed to refresh cart fragments', error)
            this._showError(null)
        } finally {
            this._busy = false
            this.el.removeAttribute('aria-busy')
        }
    }

    async _fetchHtml(url) {
        const response = await fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })

        if (!response.ok) {
            throw new Error(`Fragment fetch failed: ${response.status}`)
        }

        return response.text()
    }

    _parseRoot(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    _replaceComponent(componentName, html, root) {
        if (!root) {
            return
        }

        const existing = root.querySelector(`[data-component="${componentName}"]`)
        const next = this._parseRoot(html)

        if (!existing || !next) {
            return
        }

        existing.replaceWith(next)
    }

    _showError(message) {
        if (!this._alertEl) {
            return
        }

        this._alertEl.hidden = false
        this._alertEl.textContent = message || this._alertEl.dataset.fallback || ''
    }

    _clearError() {
        if (!this._alertEl) {
            return
        }

        this._alertEl.hidden = true
        this._alertEl.textContent = ''
    }
}
