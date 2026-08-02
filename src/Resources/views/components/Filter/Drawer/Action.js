export default class FilterDrawerAction extends ShopwareComponent {
    static options = {
        drawerUrl: null,
        drawerComponentName: 'ViewsTheme:Drawer',
        drawerSelector: '#vi-filter-drawer',
        listingComponent: 'ViewsTheme:Product:Listing',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
    }

    init() {
        this._drawerEl = null
        this._loading = false
        this._onClick = this._onClick.bind(this)
        this._onDrawerOpen = this._onDrawerOpen.bind(this)
        this._onDrawerClose = this._onDrawerClose.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.on(this.options.closeEvent, this._onDrawerClose)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.off(this.options.closeEvent, this._onDrawerClose)
        this._unmountDrawer()
    }

    /**
     * Public API — click and callMethod.
     * No-op when already open.
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

    async _loadAndMountDrawer() {
        if (!this.options.drawerUrl) {
            console.error('FilterDrawerAction: drawerUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            const response = await fetch(this._drawerRequestUrl(), {
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
                console.error('FilterDrawerAction: Drawer component did not mount')
                return
            }

            drawer.open()
            // Children (Panel/facets) init after Drawer; second frame then sync.
            await new Promise((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(resolve))
            })
            this._syncListingControls()
        } catch (error) {
            console.error('FilterDrawerAction: Failed to open filter drawer', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _drawerRequestUrl() {
        const url = new URL(this.options.drawerUrl, window.location.origin)
        const current = new URLSearchParams(window.location.search)
        current.forEach((value, key) => {
            url.searchParams.set(key, value)
        })
        return url.toString()
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
            throw new Error('FilterDrawerAction: Drawer markup is empty')
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

        if (!this._drawerEl || !window.Shopware?.getComponentInstanceByElement) {
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
        this._syncListingControls()
    }

    _onDrawerClose(drawerEl) {
        if (drawerEl && this._drawerEl && drawerEl !== this._drawerEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'false')
        this._unmountDrawer()
        this._syncListingControls()
        this.el.focus()
    }

    _unmountDrawer() {
        const el = this._drawerEl || document.querySelector(this.options.drawerSelector)
        if (el) {
            el.remove()
        }
        this._drawerEl = null
    }

    _syncListingControls() {
        if (!window.Shopware?.getComponentInstanceByElement) {
            return
        }

        const listingEl = document.querySelector(
            `[data-component="${this.options.listingComponent}"]`,
        )
        if (!listingEl) {
            return
        }

        const listing = window.Shopware.getComponentInstanceByElement(
            this.options.listingComponent,
            listingEl,
        )
        if (!listing) {
            return
        }

        if (typeof listing.syncControls === 'function') {
            listing.syncControls()
            return
        }

        if (typeof listing.refreshControls === 'function') {
            listing.refreshControls()
        }
    }
}
