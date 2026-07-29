export default class CartDrawerAction extends ShopwareComponent {
    static options = {
        drawerUrl: null,
        drawerComponentName: 'ViewsTheme:Drawer',
        drawerSelector: '#vi-cart-drawer',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
        changedEvent: 'ViewsTheme:Cart:Changed',
        /** Cart:Changed.action values that auto-open when ok (empty = never) */
        openOnActions: ['add'],
    }

    init() {
        this._drawerEl = null
        this._loading = false
        this._onClick = this._onClick.bind(this)
        this._onDrawerOpen = this._onDrawerOpen.bind(this)
        this._onDrawerClose = this._onDrawerClose.bind(this)
        this._onCartChanged = this._onCartChanged.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.on(this.options.closeEvent, this._onDrawerClose)
        window.Shopware.on(this.options.changedEvent, this._onCartChanged)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.off(this.options.closeEvent, this._onDrawerClose)
        window.Shopware.off(this.options.changedEvent, this._onCartChanged)
    }

    /**
     * Public API — header click, callMethod, and openOnActions auto-open.
     * No-op when already open (Body refreshes on Cart:Changed).
     */
    async open() {
        if (this._loading) {
            return
        }

        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.isOpen === 'function' && drawer.isOpen()) {
            return
        }

        await this._loadAndMountDrawer()
    }

    async close() {
        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.close === 'function') {
            drawer.close()
        }
    }

    async _onClick(event) {
        event.preventDefault()

        if (this._loading) {
            return
        }

        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.isOpen === 'function' && drawer.isOpen()) {
            drawer.close()
            return
        }

        await this.open()
    }

    _onCartChanged(payload) {
        if (!payload?.ok) {
            return
        }

        const actions = Array.isArray(this.options.openOnActions)
            ? this.options.openOnActions
            : []

        if (!actions.includes(payload.action)) {
            return
        }

        void this.open()
    }

    async _loadAndMountDrawer() {
        if (!this.options.drawerUrl) {
            console.error('CartDrawerAction: drawerUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            const response = await fetch(this.options.drawerUrl, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })

            if (!response.ok) {
                throw new Error(`Drawer fetch failed: ${response.status}`)
            }

            const html = await response.text()
            this._replaceDrawer(html)
            await this._waitForDrawerInstance()

            const drawer = this._getDrawerInstance()
            if (!drawer || typeof drawer.open !== 'function') {
                console.error('CartDrawerAction: Drawer component did not mount')
                return
            }

            drawer.open()
        } catch (error) {
            console.error('CartDrawerAction: Failed to open cart drawer', error)
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

    _replaceDrawer(html) {
        const existing = document.querySelector(this.options.drawerSelector)
        if (existing) {
            existing.remove()
        }

        const drawerEl = this._parseRoot(html)
        if (!drawerEl) {
            throw new Error('CartDrawerAction: Drawer markup is empty')
        }

        document.body.appendChild(drawerEl)
        this._drawerEl = drawerEl
    }

    async _waitForDrawerInstance(retries = 20) {
        for (let i = 0; i < retries; i++) {
            if (this._getDrawerInstance()) {
                return
            }

            await new Promise((resolve) => {
                requestAnimationFrame(resolve)
            })
        }
    }

    _getDrawerInstance() {
        if (!this._drawerEl || !document.body.contains(this._drawerEl)) {
            this._drawerEl = document.querySelector(this.options.drawerSelector)
        }

        if (!this._drawerEl || !window.Shopware) {
            return null
        }

        return window.Shopware.getComponentInstanceByElement(
            this.options.drawerComponentName,
            this._drawerEl,
        )
    }

    _onDrawerOpen(drawerEl) {
        if (drawerEl && this._drawerEl && drawerEl !== this._drawerEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
    }

    _onDrawerClose(drawerEl) {
        if (drawerEl && this._drawerEl && drawerEl !== this._drawerEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'false')
        this._unmountDrawer()
    }

    _unmountDrawer() {
        const el = this._drawerEl || document.querySelector(this.options.drawerSelector)
        if (el) {
            el.remove()
        }
        this._drawerEl = null
    }
}
