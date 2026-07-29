export default class SearchAction extends ShopwareComponent {
    static options = {
        overlayUrl: null,
        overlayComponentName: 'ViewsTheme:Search:Overlay',
        overlaySelector: '[data-component="ViewsTheme:Search:Overlay"]',
        openEvent: 'ViewsTheme:Search:Overlay:Open',
        closeEvent: 'ViewsTheme:Search:Overlay:Close',
    }

    init() {
        this._overlayEl = null
        this._preservedTerm = ''
        this._loading = false
        this._onClick = this._onClick.bind(this)
        this._onOverlayOpen = this._onOverlayOpen.bind(this)
        this._onOverlayClose = this._onOverlayClose.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.openEvent, this._onOverlayOpen)
        window.Shopware.on(this.options.closeEvent, this._onOverlayClose)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.openEvent, this._onOverlayOpen)
        window.Shopware.off(this.options.closeEvent, this._onOverlayClose)
    }

    /**
     * Public API — header click and callMethod.
     * Optional term: set preserved term and/or re-apply when already open.
     */
    async open({ term } = {}) {
        if (this._loading) {
            return
        }

        if (typeof term === 'string') {
            this._preservedTerm = term
        }

        const overlay = this._getOverlayInstance()
        if (overlay && typeof overlay.isOpen === 'function' && overlay.isOpen()) {
            if (typeof overlay.open === 'function') {
                await overlay.open({ term: this._preservedTerm || null })
            }
            return
        }

        await this._loadAndMountOverlay()
    }

    async close() {
        const overlay = this._getOverlayInstance()
        if (overlay && typeof overlay.close === 'function') {
            overlay.close()
        }
    }

    async _onClick(event) {
        event.preventDefault()

        if (this._loading) {
            return
        }

        const overlay = this._getOverlayInstance()
        if (overlay && typeof overlay.isOpen === 'function' && overlay.isOpen()) {
            overlay.close()
            return
        }

        await this.open()
    }

    async _loadAndMountOverlay() {
        if (!this.options.overlayUrl) {
            console.error('SearchAction: overlayUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            const response = await fetch(this.options.overlayUrl, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })

            if (!response.ok) {
                throw new Error(`Overlay fetch failed: ${response.status}`)
            }

            const html = await response.text()
            this._replaceOverlay(html)
            await this._waitForOverlayInstance()

            const overlay = this._getOverlayInstance()
            if (!overlay || typeof overlay.open !== 'function') {
                console.error('SearchAction: Overlay component did not mount')
                return
            }

            await overlay.open({ term: this._preservedTerm || null })
        } catch (error) {
            console.error('SearchAction: Failed to open search overlay', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _parseRoot(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    _replaceOverlay(html) {
        const existing = document.querySelector(this.options.overlaySelector)
        if (existing) {
            existing.remove()
        }

        const overlayEl = this._parseRoot(html)
        if (!overlayEl) {
            throw new Error('SearchAction: Overlay markup is empty')
        }

        document.body.appendChild(overlayEl)
        this._overlayEl = overlayEl
    }

    async _waitForOverlayInstance(retries = 20) {
        for (let i = 0; i < retries; i++) {
            if (this._getOverlayInstance()) {
                return
            }

            await new Promise((resolve) => {
                requestAnimationFrame(resolve)
            })
        }
    }

    _getOverlayInstance() {
        if (!this._overlayEl || !document.body.contains(this._overlayEl)) {
            this._overlayEl = document.querySelector(this.options.overlaySelector)
        }

        if (!this._overlayEl || !window.Shopware) {
            return null
        }

        return window.Shopware.getComponentInstanceByElement(
            this.options.overlayComponentName,
            this._overlayEl,
        )
    }

    _onOverlayOpen(payload) {
        const el = payload?.el ?? null
        if (el && this._overlayEl && el !== this._overlayEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
    }

    _onOverlayClose(payload) {
        const el = payload?.el ?? null
        const term = payload?.term
        if (el && this._overlayEl && el !== this._overlayEl) {
            return
        }

        this._preservedTerm = typeof term === 'string' ? term : ''
        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
        this._unmountOverlay()
    }

    _unmountOverlay() {
        const el = this._overlayEl || document.querySelector(this.options.overlaySelector)
        if (el) {
            el.remove()
        }
        this._overlayEl = null
    }
}
