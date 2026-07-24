export default class NavigationDrawerAction extends ShopwareComponent {
    static options = {
        drawerUrl: null,
        shellSelector: '#vi-navigation-drawer-shell',
        drawerComponentName: 'ViewsTheme:Drawer',
        drawerSelector: '[data-component="ViewsTheme:Drawer"]',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
    }

    init() {
        this._shellEl = null
        this._drawerEl = null
        this._drawerHtml = null
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
    }

    async _onClick(event) {
        event.preventDefault()

        if (this._loading) {
            return
        }

        const drawer = this._getDrawerInstance()
        if (drawer) {
            if (typeof drawer.isOpen === 'function' && drawer.isOpen()) {
                drawer.close()
            } else {
                drawer.open()
            }
            return
        }

        await this._loadAndMountDrawer()
    }

    async _loadAndMountDrawer() {
        if (!this.options.drawerUrl) {
            console.error('NavigationDrawerAction: drawerUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            if (!this._drawerHtml) {
                const url = new URL(this.options.drawerUrl, window.location.origin)
                if (window.activeNavigationId) {
                    url.searchParams.set('navigationId', window.activeNavigationId)
                }

                const response = await fetch(url.toString(), {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                })

                if (!response.ok) {
                    throw new Error(`Drawer fetch failed: ${response.status}`)
                }

                this._drawerHtml = await response.text()
            }

            this._mountShell(this._drawerHtml)
            await this._waitForDrawerInstance()

            const drawer = this._getDrawerInstance()
            if (drawer && typeof drawer.open === 'function') {
                drawer.open()
            }
        } catch (error) {
            console.error('NavigationDrawerAction: Failed to open navigation drawer', error)
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

    _mountShell(html) {
        const existing = document.querySelector(this.options.shellSelector)
        if (existing) {
            this._shellEl = existing
            this._drawerEl = existing.querySelector(this.options.drawerSelector)
            return
        }

        const shellEl = this._parseRoot(html)
        if (!shellEl) {
            throw new Error('NavigationDrawerAction: Drawer markup is empty')
        }

        document.body.appendChild(shellEl)
        this._shellEl = shellEl
        this._drawerEl = shellEl.querySelector(this.options.drawerSelector)
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
        if (!this._shellEl || !document.body.contains(this._shellEl)) {
            this._shellEl = document.querySelector(this.options.shellSelector)
        }

        if (this._shellEl) {
            this._drawerEl = this._shellEl.querySelector(this.options.drawerSelector)
        } else if (!this._drawerEl || !document.body.contains(this._drawerEl)) {
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
        if (drawerEl && this._shellEl && !this._shellEl.contains(drawerEl) && this._shellEl !== drawerEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
    }

    _onDrawerClose(drawerEl) {
        if (drawerEl && this._shellEl && !this._shellEl.contains(drawerEl) && this._shellEl !== drawerEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
    }
}
