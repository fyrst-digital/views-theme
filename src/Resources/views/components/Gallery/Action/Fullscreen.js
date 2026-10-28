import {
    abortRequest,
    beginRequest,
    fetchText,
    mountShell,
    releaseShell,
    shell,
} from '@views-theme/modules/lazy-shell.js'
import { galleries, select } from '@views-theme/modules/gallery/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Lazy-loads Gallery:Fullscreen shell; owns mount lifecycle.
 *
 * @extends {ThemeComponent}
 */
export default class GalleryActionFullscreen extends ThemeComponent {
    static options = {
        overlayUrl: null,
        ids: [],
        galleryId: null,
        shellId: 'vi-gallery-fullscreen',
    }

    init() {
        /** True while this Action's gallery owns the (single, shared) fullscreen shell. */
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
        this._unmountOverlay()

        super.destroy()
    }

    async open() {
        if (this._loading) {
            return
        }

        const overlay = this._getOverlayInstance()
        if (overlay && typeof overlay.isOpen === 'function' && overlay.isOpen()) {
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

    /**
     * @param {MouseEvent} event
     */
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
            console.error('GalleryActionFullscreen: overlayUrl is missing')
            return
        }

        const ids = Array.isArray(this.options.ids) ? this.options.ids : []
        if (!ids.length) {
            console.error('GalleryActionFullscreen: ids are missing')
            return
        }

        this._loading = true
        this.el.setAttribute('aria-busy', 'true')
        const request = beginRequest(this._fetch)

        try {
            this._closeForeignShell()

            const url = new URL(this.options.overlayUrl, window.location.origin)
            for (const id of ids) {
                url.searchParams.append('ids[]', String(id))
            }
            url.searchParams.set('active', String(this._galleryIndex()))

            const html = await fetchText(url.toString(), { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }

            if (!String(html || '').trim()) {
                return
            }

            this._owns = true
            const api = await mountShell(this.options.shellId, html)

            if (!request.isCurrent()) {
                return
            }

            const overlay = api
            if (!overlay || typeof overlay.open !== 'function') {
                console.error('GalleryActionFullscreen: Fullscreen component did not mount')
                return
            }

            await overlay.open()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('GalleryActionFullscreen: Failed to open fullscreen', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    /**
     * Close another Action's live shell so its owner can restore index + unmount
     * before this Action mounts. The close notifies the registry synchronously,
     * so the previous owner has unmounted by the time this returns.
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

    /**
     * @returns {number}
     */
    _galleryIndex() {
        return galleries.get(this.options.galleryId).index.get()
    }

    _getOverlayInstance() {
        return this._owns ? shell(this.options.shellId).api.get() : null
    }

    /**
     * @param {boolean} open
     */
    _onShellOpen(open) {
        if (!this._owns) {
            return
        }

        if (open) {
            this.el.setAttribute('aria-expanded', 'true')
            return
        }

        const index = shell(this.options.shellId).detail?.index
        if (typeof index === 'number' && !Number.isNaN(index)) {
            select(this.options.galleryId, index)
        }

        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
        this._unmountOverlay()
    }

    _unmountOverlay() {
        if (this._owns) {
            releaseShell(this.options.shellId)
        }
        this._owns = false
    }
}
