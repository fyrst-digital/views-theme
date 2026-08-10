import {
    abortRequest,
    beginRequest,
    fetchText,
    getInstanceByElement,
    replaceMount,
    unmountEl,
    waitForInstance,
} from '@views-theme/modules/lazy-shell.js'

/**
 * Lazy-loads Gallery:Fullscreen shell; owns mount lifecycle.
 *
 * @extends {ShopwareComponent}
 */
export default class GalleryActionFullscreen extends ShopwareComponent {
    static options = {
        overlayUrl: null,
        ids: [],
        galleryComponent: 'ViewsTheme:Gallery',
        overlayComponentName: 'ViewsTheme:Gallery:Fullscreen',
        overlaySelector: '[data-component="ViewsTheme:Gallery:Fullscreen"]',
        openEvent: 'ViewsTheme:Gallery:Fullscreen:Open',
        closeEvent: 'ViewsTheme:Gallery:Fullscreen:Close',
    }

    init() {
        this._overlayEl = null
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
        this._onClick = this._onClick.bind(this)
        this._onOverlayOpen = this._onOverlayOpen.bind(this)
        this._onOverlayClose = this._onOverlayClose.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.openEvent, this._onOverlayOpen)
        window.Shopware.on(this.options.closeEvent, this._onOverlayClose)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.openEvent, this._onOverlayOpen)
        window.Shopware.off(this.options.closeEvent, this._onOverlayClose)
        abortRequest(this._fetch)
        this._unmountOverlay()
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

            this._overlayEl = replaceMount(this.options.overlaySelector, html)
            await waitForInstance(() => this._getOverlayInstance())

            if (!request.isCurrent()) {
                return
            }

            const overlay = this._getOverlayInstance()
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
     * before this Action mounts. Avoids replaceMount tearing down a foreign DOM
     * node without emitting Close.
     */
    _closeForeignShell() {
        const existing = document.querySelector(this.options.overlaySelector)
        if (!existing || existing === this._overlayEl) {
            return
        }

        const inst = getInstanceByElement(this.options.overlayComponentName, existing)
        if (inst && typeof inst.isOpen === 'function' && inst.isOpen() && typeof inst.close === 'function') {
            inst.close()
            return
        }

        existing.remove()
    }

    /**
     * @returns {number}
     */
    _galleryIndex() {
        const gallery = this._gallery()
        if (gallery && typeof gallery.getIndex === 'function') {
            return Number(gallery.getIndex()) || 0
        }
        return 0
    }

    /**
     * @returns {import('../../Gallery.js').default|null}
     */
    _gallery() {
        const name = this.options.galleryComponent
        const el = this.el.closest(`[data-component="${name}"]`)
        return getInstanceByElement(name, el)
    }

    _getOverlayInstance() {
        if (!this._overlayEl || !document.body.contains(this._overlayEl)) {
            this._overlayEl = null
            return null
        }

        return getInstanceByElement(this.options.overlayComponentName, this._overlayEl)
    }

    _onOverlayOpen(payload) {
        if (!this._overlayEl || payload?.el !== this._overlayEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
    }

    _onOverlayClose(payload) {
        if (!this._overlayEl || payload?.el !== this._overlayEl) {
            return
        }

        const index = payload?.index
        if (typeof index === 'number' && !Number.isNaN(index)) {
            this._gallery()?.select?.(index, { emit: false, scroll: true })
        }

        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
        this._unmountOverlay()
    }

    _unmountOverlay() {
        if (this._overlayEl) {
            unmountEl(this._overlayEl)
        }
        this._overlayEl = null
    }
}
