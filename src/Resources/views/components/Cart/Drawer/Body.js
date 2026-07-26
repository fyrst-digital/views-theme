export default class CartDrawerBody extends ShopwareComponent {
    static options = {
        partialsUrl: null,
        changedEvent: 'ViewsTheme:Cart:Changed',
        headingComponent: 'ViewsTheme:Cart:Drawer:Heading',
        itemsComponent: 'ViewsTheme:Cart:Drawer:Items',
        footerComponent: 'ViewsTheme:Cart:Drawer:Footer',
        drawerSelector: '#vi-cart-drawer',
    }

    init() {
        this._busy = false
        this._queued = false
        this._onCartChanged = this._onCartChanged.bind(this)
        this._drawerEl = this.el.closest(this.options.drawerSelector) || document.querySelector(this.options.drawerSelector)
        this._alertEl = this.el.querySelector('[role="alert"]')

        window.Shopware.on(this.options.changedEvent, this._onCartChanged)
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onCartChanged)
        this._queued = false
    }

    async _onCartChanged(payload) {
        if (!payload || payload.ok === false) {
            this._showError(payload?.error)
            return
        }

        this._clearError()
        await this._refreshPartials()
    }

    async _refreshPartials() {
        if (this._busy) {
            this._queued = true
            return
        }

        if (!this.options.partialsUrl) {
            return
        }

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            do {
                this._queued = false
                const html = await this._fetchHtml(this.options.partialsUrl)
                this._applyPartials(html)
            } while (this._queued)
        } catch (error) {
            console.error('CartDrawerBody: Failed to refresh cart partials', error)
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
            throw new Error(`Partials fetch failed: ${response.status}`)
        }

        return response.text()
    }

    _parseRoot(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    _applyPartials(html) {
        const root = this._parseRoot(html)
        if (!root) {
            return
        }

        this._replaceFrom(root, this.options.itemsComponent, this.el)
        this._replaceFrom(root, this.options.footerComponent, this.el)
        this._replaceFrom(root, this.options.headingComponent, this._drawerEl || document)
    }

    _replaceFrom(sourceRoot, componentName, targetRoot) {
        if (!targetRoot) {
            return
        }

        const next = sourceRoot.querySelector(`[data-component="${componentName}"]`)
        const existing = targetRoot.querySelector(`[data-component="${componentName}"]`)

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
