import {
    abortRequest,
    beginRequest,
    fetchText,
    getInstanceByElement,
    replaceMount,
    unmountEl,
    waitForInstance,
} from '@views-theme/modules/lazy-shell.js'

export default class NavigationDrawerAction extends ShopwareComponent {
    static options = {
        drawerUrl: null,
        drawerComponentName: 'ViewsTheme:Drawer',
        drawerSelector: '#vi-navigation-drawer',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
    }

    init() {
        this._drawerEl = null
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
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
        abortRequest(this._fetch)
        this._unmountDrawer()
    }

    /**
     * Public API — header click and callMethod.
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
            console.error('NavigationDrawerAction: drawerUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')
        const request = beginRequest(this._fetch)

        try {
            const url = new URL(this.options.drawerUrl, window.location.origin)
            if (window.activeNavigationId) {
                url.searchParams.set('navigationId', window.activeNavigationId)
            }

            const html = await fetchText(url.toString(), { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }

            this._drawerEl = replaceMount(this.options.drawerSelector, html)
            await waitForInstance(() => this._getDrawerInstance())

            if (!request.isCurrent()) {
                return
            }

            const drawer = this._getDrawerInstance()
            if (!drawer || typeof drawer.open !== 'function') {
                console.error('NavigationDrawerAction: Drawer component did not mount')
                return
            }

            drawer.open()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('NavigationDrawerAction: Failed to open navigation drawer', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _getDrawerInstance() {
        if (!this._drawerEl || !document.body.contains(this._drawerEl)) {
            this._drawerEl = document.querySelector(this.options.drawerSelector)
        }

        return getInstanceByElement(this.options.drawerComponentName, this._drawerEl)
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
        this.el.focus()
        this._unmountDrawer()
    }

    _unmountDrawer() {
        unmountEl(this._drawerEl, this.options.drawerSelector)
        this._drawerEl = null
    }
}
