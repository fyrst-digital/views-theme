import {
    getInstanceByElement,
    mountTemplate,
    unmountEl,
    mountComponents,
} from '@views-theme/modules/lazy-shell.js'

/**
 * @extends {ShopwareComponent}
 */
export default class SearchAction extends ShopwareComponent {
    static options = {
        /** `<template>` with the static overlay shell (rendered next to the Action) */
        templateId: 'vi-search-overlay-template',
        overlayComponentName: 'ViewsTheme:Search:Overlay',
        overlaySelector: '[data-component="ViewsTheme:Search:Overlay"]',
        openEvent: 'ViewsTheme:Search:Overlay:Open',
        closeEvent: 'ViewsTheme:Search:Overlay:Close',
    }

    init() {
        this._overlayEl = null
        this._preservedTerm = ''
        this._loading = false
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
        this._unmountOverlay()
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

        await this._mountAndOpenOverlay()
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

    async _mountAndOpenOverlay() {
        this._loading = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            this._overlayEl = mountTemplate(this.options.templateId, this.options.overlaySelector)
            await mountComponents(this._overlayEl)

            const overlay = this._getOverlayInstance()
            if (!overlay || typeof overlay.open !== 'function') {
                console.error('SearchAction: Overlay component did not mount')
                return
            }

            await overlay.open({ term: this._preservedTerm || null })
        } catch (error) {
            console.error('SearchAction: Failed to open search overlay', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _getOverlayInstance() {
        if (!this._overlayEl || !document.body.contains(this._overlayEl)) {
            this._overlayEl = document.querySelector(this.options.overlaySelector)
        }

        return getInstanceByElement(this.options.overlayComponentName, this._overlayEl)
    }

    _onOverlayOpen(payload) {
        const el = payload?.el ?? null
        if (el && this._overlayEl && el !== this._overlayEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
    }

    _onOverlayClose(payload) {
        const el = payload?.el ?? null
        const term = payload?.term
        if (el && this._overlayEl && el !== this._overlayEl) {
            return
        }

        this._preservedTerm = typeof term === 'string' ? term : ''
        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
        this._unmountOverlay()
    }

    _unmountOverlay() {
        unmountEl(this._overlayEl, this.options.overlaySelector)
        this._overlayEl = null
    }
}
