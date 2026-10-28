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
export default class FilterDrawerAction extends ThemeComponent {
    static options = {
        drawerUrl: null,
        shellId: 'vi-filter-drawer',
        showActive: true,
    }

    init() {
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
        this._onClick = this._onClick.bind(this)
        this._onShellOpen = this._onShellOpen.bind(this)

        this.scope.on(this.el, 'click', this._onClick)
        this.scope.watch(shell(this.options.shellId).open, this._onShellOpen)
    }

    destroy() {
        abortRequest(this._fetch)
        this._unmountDrawer()

        super.destroy()
    }

    /**
     * Public API — click and callMethod.
     * No-op when already open.
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

    async _loadAndMountDrawer() {
        if (!this.options.drawerUrl) {
            console.error('FilterDrawerAction: drawerUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')
        const request = beginRequest(this._fetch)

        try {
            const html = await fetchText(this._drawerRequestUrl(), { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }

            const api = await mountShell(this.options.shellId, html)

            if (!request.isCurrent()) {
                return
            }

            const drawer = api
            if (!drawer || typeof drawer.open !== 'function') {
                console.error('FilterDrawerAction: Drawer component did not mount')
                return
            }

            // Facets in the drawer register themselves with the listing and hydrate on connect.
            drawer.open()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
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
        url.searchParams.set(
            'viShowActiveFilters',
            this.options.showActive === false ? '0' : '1',
        )
        return url.toString()
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
        if (!open) {
            this.el.focus()
        }
    }

    _unmountDrawer() {
        releaseShell(this.options.shellId)
    }
}
