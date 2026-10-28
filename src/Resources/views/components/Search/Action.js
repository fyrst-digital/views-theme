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
export default class SearchAction extends ThemeComponent {
    static options = {
        overlayUrl: null,
        shellId: 'vi-search-overlay',
    }

    init() {
        this._preservedTerm = ''
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
        this._onClick = this._onClick.bind(this)
        this._onShellOpen = this._onShellOpen.bind(this)

        this.scope.on(this.el, 'click', this._onClick)
        this.scope.watch(shell(this.options.shellId).open, this._onShellOpen)
    }

    destroy() {
        abortRequest(this._fetch)
        this._unmountOverlay()

        super.destroy()
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
        const request = beginRequest(this._fetch)

        try {
            const html = await fetchText(this.options.overlayUrl, { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }

            const api = await mountShell(this.options.shellId, html)

            if (!request.isCurrent()) {
                return
            }

            const overlay = api
            if (!overlay || typeof overlay.open !== 'function') {
                console.error('SearchAction: Overlay component did not mount')
                return
            }

            await overlay.open({ term: this._preservedTerm || null })
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('SearchAction: Failed to open search overlay', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _getOverlayInstance() {
        return shell(this.options.shellId).api.get()
    }

    /**
     * @param {boolean} open
     */
    _onShellOpen(open) {
        if (open) {
            this.el.setAttribute('aria-expanded', 'true')
            return
        }

        const term = shell(this.options.shellId).detail?.term
        this._preservedTerm = typeof term === 'string' ? term : ''
        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
        this._unmountOverlay()
    }

    _unmountOverlay() {
        releaseShell(this.options.shellId)
    }
}
