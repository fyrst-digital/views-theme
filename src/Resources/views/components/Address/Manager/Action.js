import {
    abortRequest,
    beginRequest,
    eventEl,
    fetchText,
    getInstanceByElement,
    replaceMount,
    unmountEl,
    waitForInstance,
} from '@views-theme/modules/lazy-shell.js'

/**
 * Lazy-loads Address:Manager shell; owns mount lifecycle.
 *
 * @extends {ShopwareComponent}
 */
export default class AddressManagerAction extends ShopwareComponent {
    static options = {
        managerUrl: null,
        editorUrl: null,
        tab: 'shipping',
        hideShipping: false,
        managerComponent: 'ViewsTheme:Address:Manager',
        managerSelector: '[data-component="ViewsTheme:Address:Manager"]',
        modalComponent: 'ViewsTheme:Modal',
        modalSelector: '[data-component="ViewsTheme:Modal"]',
        openEvent: 'ViewsTheme:Modal:Open',
        closeEvent: 'ViewsTheme:Modal:Close',
    }

    init() {
        this._managerEl = null
        this._loading = false
        this._fetch = { controller: null, seq: 0 }
        this._onClick = this._onClick.bind(this)
        this._onModalOpen = this._onModalOpen.bind(this)
        this._onModalClose = this._onModalClose.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.openEvent, this._onModalOpen)
        window.Shopware.on(this.options.closeEvent, this._onModalClose)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.openEvent, this._onModalOpen)
        window.Shopware.off(this.options.closeEvent, this._onModalClose)
        abortRequest(this._fetch)
        this._unmountManager()
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

            this._managerEl = replaceMount(this.options.managerSelector, html)
            await waitForInstance(() => this._getModalInstance())

            if (!request.isCurrent()) {
                return
            }

            const modal = this._getModalInstance()
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

    _closeForeignShell() {
        const existing = document.querySelector(this.options.managerSelector)
        if (!existing || existing === this._managerEl) {
            return
        }

        const modalEl = existing.querySelector(this.options.modalSelector)
        if (modalEl) {
            window.Shopware.emitQueued(this.options.closeEvent, { el: modalEl })
        }

        if (document.body.contains(existing)) {
            existing.remove()
        }
    }

    _getModalInstance() {
        if (!this._managerEl || !document.body.contains(this._managerEl)) {
            this._managerEl = null
            return null
        }

        const modalEl = this._managerEl.querySelector(this.options.modalSelector)
        return getInstanceByElement(this.options.modalComponent, modalEl)
    }

    /**
     * @param {unknown} payload
     */
    _onModalOpen(payload) {
        const el = eventEl(payload)
        if (!this._managerEl || !el || !this._managerEl.contains(el)) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
    }

    /**
     * @param {unknown} payload
     */
    _onModalClose(payload) {
        const el = eventEl(payload)
        if (!this._managerEl || !el || !this._managerEl.contains(el)) {
            return
        }

        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
        this._unmountManager()
    }

    _unmountManager() {
        if (this._managerEl) {
            unmountEl(this._managerEl)
        }
        this._managerEl = null
    }
}
