import {
    abortRequest,
    beginRequest,
    fetchText,
    getInstanceByElement,
    replaceMount,
    unmountEl,
    waitForInstance,
} from '@views-theme/modules/lazy-shell.js'
import { urlWithParams } from '@views-theme/modules/shared/http.js'

/**
 * Lazy shell opener of the cookie drawer. Shows the cookie manager, or — with `{ consent }` — the
 * request for one feature cookie (wishlist). Refetches on every open and unmounts on close.
 *
 * @extends {ShopwareComponent}
 */
export default class CookieManagerAction extends ShopwareComponent {
    static options = {
        managerUrl: null,
        consentUrl: null,
        drawerComponentName: 'ViewsTheme:Drawer',
        drawerSelector: '#vi-cookie-drawer',
        drawerOpenEvent: 'ViewsTheme:Drawer:Open',
        drawerCloseEvent: 'ViewsTheme:Drawer:Close',
        openEvent: 'ViewsTheme:Cookie:Manager:Open',
        closeEvent: 'ViewsTheme:Cookie:Manager:Close',
    }

    init() {
        this._drawerEl = null
        this._view = null
        this._trigger = null
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
        this._onClick = this._onClick.bind(this)
        this._onDrawerOpen = this._onDrawerOpen.bind(this)
        this._onDrawerClose = this._onDrawerClose.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.drawerOpenEvent, this._onDrawerOpen)
        window.Shopware.on(this.options.drawerCloseEvent, this._onDrawerClose)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.drawerOpenEvent, this._onDrawerOpen)
        window.Shopware.off(this.options.drawerCloseEvent, this._onDrawerClose)
        abortRequest(this._fetch)
        this._unmountDrawer()
    }

    /**
     * Public API — own click, `callMethod`.
     *
     * @param {{ consent?: { featureName?: string, cookieName?: string } }} [options]
     *   `consent`: show the request for that feature cookie instead of the manager
     */
    async open({ consent = null } = {}) {
        if (this._loading) {
            return
        }

        const isOpen = this._getDrawerInstance()?.isOpen?.()
        if (isOpen && !consent && this._view === 'manager') {
            return
        }

        const url = consent
            ? urlWithParams(this.options.consentUrl, {
                  featureName: consent.featureName || 'wishlist',
                  cookieName: consent.cookieName || 'wishlist-enabled',
              })
            : this.options.managerUrl

        await this._loadAndMountDrawer(url, consent ? 'consent' : 'manager')
    }

    close() {
        this._getDrawerInstance()?.close?.()
    }

    /**
     * @param {MouseEvent} event
     */
    async _onClick(event) {
        event.preventDefault()

        if (this._getDrawerInstance()?.isOpen?.()) {
            this.close()
            return
        }

        await this.open()
    }

    /**
     * @param {string} url
     * @param {'manager'|'consent'} view
     */
    async _loadAndMountDrawer(url, view) {
        if (!url) {
            console.error('CookieManagerAction: drawer url is missing')
            return
        }

        this._loading = true
        this._trigger = this._trigger || document.activeElement
        this.el.setAttribute('aria-busy', 'true')
        const request = beginRequest(this._fetch)

        try {
            const html = await fetchText(url, { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }

            this._view = view
            this._drawerEl = replaceMount(this.options.drawerSelector, html)
            await waitForInstance(() => this._getDrawerInstance())

            if (!request.isCurrent()) {
                return
            }

            const drawer = this._getDrawerInstance()
            if (!drawer || typeof drawer.open !== 'function') {
                console.error('CookieManagerAction: Drawer component did not mount')
                return
            }

            drawer.open()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('CookieManagerAction: failed to open the cookie drawer', error)
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

    /**
     * @param {Element|null} drawerEl
     */
    _onDrawerOpen(drawerEl) {
        if (!this._isOwnDrawer(drawerEl)) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')

        if (this._view === 'manager') {
            window.Shopware.emit(this.options.openEvent)
        }
    }

    /**
     * @param {Element|null} drawerEl
     */
    _onDrawerClose(drawerEl) {
        if (!this._isOwnDrawer(drawerEl)) {
            return
        }

        const view = this._view
        const trigger = this._trigger

        this.el.setAttribute('aria-expanded', 'false')
        this._unmountDrawer()
        this._trigger = null

        if (view === 'manager') {
            window.Shopware.emit(this.options.closeEvent)
        }

        if (trigger?.isConnected) {
            trigger.focus?.({ preventScroll: true })
        }
    }

    /**
     * @param {Element|null} drawerEl
     * @returns {boolean}
     */
    _isOwnDrawer(drawerEl) {
        return Boolean(drawerEl) && drawerEl === this._drawerEl
    }

    _unmountDrawer() {
        unmountEl(this._drawerEl, this.options.drawerSelector)
        this._drawerEl = null
        this._view = null
    }
}
