import {
    abortRequest,
    beginRequest,
    fetchText,
    mountShell,
    releaseShell,
    shell,
} from '@views-theme/modules/lazy-shell.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class CartDrawerAction extends ThemeComponent {
    static options = {
        drawerUrl: null,
        shellId: 'vi-cart-drawer',
        changedEvent: 'ViewsTheme:Cart:Changed',
        /** Cart:Changed.action values that auto-open when ok (empty = never) */
        openOnActions: ['add'],
    }

    init() {
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
        this._onClick = this._onClick.bind(this)
        this._onShellOpen = this._onShellOpen.bind(this)
        this._onCartChanged = this._onCartChanged.bind(this)

        this.scope.on(this.el, 'click', this._onClick)
        this.scope.watch(shell(this.options.shellId).open, this._onShellOpen)
        this.scope.bus(this.options.changedEvent, this._onCartChanged)
    }

    destroy() {
        abortRequest(this._fetch)
        this._unmountDrawer()

        super.destroy()
    }

    /**
     * Public API — header click, callMethod, and openOnActions auto-open.
     * No-op when already open (Body refreshes on Cart:Changed).
     */
    async open() {
        if (this._loading) {
            return
        }

        const drawer = this._drawerApi()
        if (drawer && typeof drawer.isOpen === 'function' && drawer.isOpen()) {
            return
        }

        await this._loadAndMountDrawer()
    }

    async close() {
        const drawer = this._drawerApi()
        if (drawer && typeof drawer.close === 'function') {
            drawer.close()
        }
    }

    async _onClick(event) {
        event.preventDefault()

        if (this._loading) {
            return
        }

        const drawer = this._drawerApi()
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
        const request = beginRequest(this._fetch)

        try {
            const html = await fetchText(this.options.drawerUrl, { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }

            const api = await mountShell(this.options.shellId, html)

            if (!request.isCurrent()) {
                return
            }

            const drawer = api
            if (!drawer || typeof drawer.open !== 'function') {
                console.error('CartDrawerAction: Drawer component did not mount')
                return
            }

            drawer.open()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('CartDrawerAction: Failed to open cart drawer', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _drawerApi() {
        return shell(this.options.shellId).api.get()
    }

    /**
     * @param {boolean} open
     */
    _onShellOpen(open) {
        this.el.setAttribute('aria-expanded', open ? 'true' : 'false')
        if (!open) {
            this._unmountDrawer()
        }
    }

    _unmountDrawer() {
        releaseShell(this.options.shellId)
    }
}
