import { checkConfigurationHash, isPreferenceSet, submitConsent } from '@views-theme/modules/cookie/consent.js'

/**
 * Cookie consent bar and global consent coordinator (mounted whenever cookie consent is enabled):
 * shows while no preference is stored, applies "deny" / "accept all", re-asks when the cookie
 * configuration changed, and routes manager openers (core cookie links, consent requests) to
 * `Cookie:Manager:Action`.
 *
 * @extends {ShopwareComponent}
 */
export default class CookieBar extends ShopwareComponent {
    static options = {
        groupsUrl: null,
        /** href of the core cookie link; clicks open the manager instead of navigating */
        linkHref: null,
        actionComponent: 'ViewsTheme:Cookie:Manager:Action',
        managerOpenEvent: 'ViewsTheme:Cookie:Manager:Open',
        managerCloseEvent: 'ViewsTheme:Cookie:Manager:Close',
        /** `{ featureName, cookieName }` — a feature asks for its cookie (e.g. wishlist) */
        requestEvent: 'ViewsTheme:Cookie:Consent:Request',
    }

    init() {
        this._busy = false
        this._visible = false
        this._onClick = this._onClick.bind(this)
        this._onLinkClick = this._onLinkClick.bind(this)
        this._onManagerOpen = this._onManagerOpen.bind(this)
        this._onManagerClose = this._onManagerClose.bind(this)
        this._onRequest = this._onRequest.bind(this)
        this.show = this.show.bind(this)
        this.hide = this.hide.bind(this)

        // The bar pushes content up while it is fixed to the viewport bottom.
        this._resizeObserver = new ResizeObserver(() => this._syncPadding())
        this._resizeObserver.observe(this.el)

        this.el.addEventListener('click', this._onClick)
        document.addEventListener('click', this._onLinkClick, true)
        // External hooks (plugins, analytics) — the core DOM events.
        document.addEventListener('showCookieBar', this.show)
        document.addEventListener('hideCookieBar', this.hide)
        window.Shopware.on(this.options.managerOpenEvent, this._onManagerOpen)
        window.Shopware.on(this.options.managerCloseEvent, this._onManagerClose)
        window.Shopware.on(this.options.requestEvent, this._onRequest)

        if (!isPreferenceSet()) {
            this.show()
        }

        void this._verifyConfiguration()
    }

    destroy() {
        this._resizeObserver?.disconnect()
        this.el.removeEventListener('click', this._onClick)
        document.removeEventListener('click', this._onLinkClick, true)
        document.removeEventListener('showCookieBar', this.show)
        document.removeEventListener('hideCookieBar', this.hide)
        window.Shopware.off(this.options.managerOpenEvent, this._onManagerOpen)
        window.Shopware.off(this.options.managerCloseEvent, this._onManagerClose)
        window.Shopware.off(this.options.requestEvent, this._onRequest)
        this._setPadding(0)
    }

    show() {
        this._visible = true
        this.el.dataset.visible = 'true'
        this._syncPadding()
    }

    hide() {
        this._visible = false
        this.el.dataset.visible = 'false'
        this._syncPadding()
    }

    /**
     * Drop outdated consent (the cookie configuration changed) and ask again.
     */
    async _verifyConfiguration() {
        const outcome = await checkConfigurationHash(this.options.groupsUrl)

        if (outcome) {
            this.show()
        }
    }

    /**
     * @param {MouseEvent} event
     */
    async _onClick(event) {
        const button = event.target.closest?.('button[name="action"]')
        if (!button || this._busy) {
            return
        }

        const mode = { deny: 'required', accept: 'all' }[button.value]
        if (!mode) {
            return
        }

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            if (await submitConsent(this.options.groupsUrl, mode)) {
                this.hide()
            }
        } finally {
            this._busy = false
            this.el.removeAttribute('aria-busy')
        }
    }

    /**
     * Links to the core cookie route open the manager (plain left-clicks only).
     *
     * @param {MouseEvent} event
     */
    _onLinkClick(event) {
        if (
            !this.options.linkHref ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
        ) {
            return
        }

        const link = event.target.closest?.('a[href]')
        if (link?.getAttribute('href') !== this.options.linkHref) {
            return
        }

        event.preventDefault()
        window.Shopware.callMethod(this.options.actionComponent, 'open')
    }

    _onManagerOpen() {
        this.hide()
    }

    _onManagerClose() {
        if (!isPreferenceSet()) {
            this.show()
        }
    }

    /**
     * @param {{ featureName?: string, cookieName?: string }} payload
     */
    _onRequest(payload) {
        window.Shopware.callMethod(this.options.actionComponent, 'open', { consent: payload })
    }

    _syncPadding() {
        this._setPadding(this._visible ? this.el.offsetHeight : 0)
    }

    /**
     * @param {number} height
     */
    _setPadding(height) {
        document.body.style.paddingBottom = height ? `${height}px` : ''
    }
}
