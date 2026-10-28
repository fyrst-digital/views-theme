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
 * Lazy-loads Address:Manager shell; owns mount lifecycle.
 *
 * @extends {ThemeComponent}
 */
export default class AddressManagerAction extends ThemeComponent {
    static options = {
        managerUrl: null,
        editorUrl: null,
        tab: 'shipping',
        hideShipping: false,
        shellId: 'vi-address-manager',
    }

    init() {
        /** True while this Action owns the (single, shared) manager shell. */
        this._owns = false
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
        this._onClick = this._onClick.bind(this)
        this._onShellOpen = this._onShellOpen.bind(this)

        this.scope.on(this.el, 'click', this._onClick)
        this.scope.watch(shell(this.options.shellId).open, this._onShellOpen)
    }

    destroy() {
        abortRequest(this._fetch)
        this._unmountManager()

        super.destroy()
    }

    async open() {
        if (this._loading) {
            return
        }

        const modal = this._getModalInstance()
        if (modal && typeof modal.isOpen === 'function' && modal.isOpen()) {
            return
        }

        await this._loadAndMount()
    }

    async close() {
        const modal = this._getModalInstance()
        if (modal && typeof modal.close === 'function') {
            modal.close()
        }
    }

    /**
     * @param {MouseEvent} event
     */
    async _onClick(event) {
        event.preventDefault()

        if (this._loading) {
            return
        }

        const modal = this._getModalInstance()
        if (modal && typeof modal.isOpen === 'function' && modal.isOpen()) {
            modal.close()
            return
        }

        await this.open()
    }

    async _loadAndMount() {
        if (!this.options.managerUrl) {
            console.error('AddressManagerAction: managerUrl is missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')
        const request = beginRequest(this._fetch)

        try {
            this._closeForeignShell()

            const url = new URL(this.options.managerUrl, window.location.origin)
            url.searchParams.set('tab', this.options.tab === 'billing' ? 'billing' : 'shipping')
            if (this.options.hideShipping) {
                url.searchParams.set('hideShipping', '1')
            }

            const html = await fetchText(url.toString(), { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }

            this._owns = true
            const api = await mountShell(this.options.shellId, html)

            if (!request.isCurrent()) {
                return
            }

            const modal = api
            if (!modal || typeof modal.open !== 'function') {
                console.error('AddressManagerAction: Modal component did not mount')
                return
            }

            modal.open()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('AddressManagerAction: Failed to open address manager', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    /**
     * Close another Action's live manager first, so its owner resets
     * `aria-expanded` and unmounts before this Action mounts.
     */
    _closeForeignShell() {
        if (this._owns) {
            return
        }

        const api = shell(this.options.shellId).api.get()
        if (!api) {
            return
        }

        if (typeof api.isOpen === 'function' && api.isOpen() && typeof api.close === 'function') {
            api.close()
        }
        releaseShell(this.options.shellId)
    }

    _getModalInstance() {
        return this._owns ? shell(this.options.shellId).api.get() : null
    }

    /**
     * @param {boolean} open
     */
    _onShellOpen(open) {
        if (!this._owns) {
            return
        }

        this.el.setAttribute('aria-expanded', open ? 'true' : 'false')
        if (!open) {
            this.el.focus()
            this._unmountManager()
        }
    }

    _unmountManager() {
        if (this._owns) {
            releaseShell(this.options.shellId)
        }
        this._owns = false
    }
}
