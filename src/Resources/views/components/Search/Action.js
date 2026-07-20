export default class SearchAction extends ShopwareComponent {
    static options = {
        overlayUrl: null,
        overlayComponentName: 'ViewsTheme:Search:Overlay',
        overlaySelector: '[data-component="ViewsTheme:Search:Overlay"]',
    }

    init() {
        this._overlayEl = null
        this._overlayHtml = null
        this._loading = false
        this._onClick = this._onClick.bind(this)
        this._onOverlayOpen = this._onOverlayOpen.bind(this)
        this._onOverlayClose = this._onOverlayClose.bind(this)

        this.el.addEventListener('click', this._onClick)
        document.addEventListener('ViewsTheme:Search:Overlay:open', this._onOverlayOpen)
        document.addEventListener('ViewsTheme:Search:Overlay:close', this._onOverlayClose)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        document.removeEventListener('ViewsTheme:Search:Overlay:open', this._onOverlayOpen)
        document.removeEventListener('ViewsTheme:Search:Overlay:close', this._onOverlayClose)
    }

    async _onClick(event) {
        event.preventDefault()

        if (this._loading) {
            return
        }

        const overlay = this._getOverlayInstance()
        if (overlay) {
            if (typeof overlay.isOpen === 'function' && overlay.isOpen()) {
                overlay.close()
            } else {
                overlay.open()
            }
            return
        }

        await this._loadAndMountOverlay()
    }

    async _loadAndMountOverlay() {
        if (!this.options.overlayUrl) {
            console.error('SearchAction: overlayUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            if (!this._overlayHtml) {
                const response = await fetch(this.options.overlayUrl, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                })

                if (!response.ok) {
                    throw new Error(`Overlay fetch failed: ${response.status}`)
                }

                this._overlayHtml = await response.text()
            }

            this._mountOverlay(this._overlayHtml)
            await this._waitForOverlayInstance()
            this._initializePlugins()

            const overlay = this._getOverlayInstance()
            if (overlay && typeof overlay.open === 'function') {
                overlay.open()
            }
        } catch (error) {
            console.error('SearchAction: Failed to open search overlay', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _mountOverlay(html) {
        const existing = document.querySelector(this.options.overlaySelector)
        if (existing) {
            this._overlayEl = existing
            return
        }

        const template = document.createElement('template')
        template.innerHTML = html.trim()
        const overlayEl = template.content.firstElementChild

        if (!overlayEl) {
            throw new Error('SearchAction: Overlay markup is empty')
        }

        document.body.appendChild(overlayEl)
        this._overlayEl = overlayEl
    }

    _initializePlugins() {
        if (!this._overlayEl || !window.PluginManager) {
            return
        }

        if (typeof window.PluginManager.initializePluginsInParentElement === 'function') {
            window.PluginManager.initializePluginsInParentElement(this._overlayEl)
        }
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

    _onOverlayOpen() {
        this.el.setAttribute('aria-expanded', 'true')
    }

    _onOverlayClose() {
        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
    }
}
