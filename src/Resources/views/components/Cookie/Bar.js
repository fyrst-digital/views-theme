import { getInstanceByElement } from '@views-theme/modules/lazy-shell.js'
import { checkConfigurationHash, isPreferenceSet, submitConsent } from '@views-theme/modules/cookie/consent.js'

/**
 * Cookie consent bar and global consent coordinator (mounted whenever cookie consent is enabled):
 * shows while no preference is stored, applies "deny" / "accept all", re-asks when the cookie
 * configuration changed or this language has no consent yet, and routes manager openers (core
 * cookie links, manager / consent requests) to the `Cookie:Manager:Action` inside the bar.
 *
 * @extends {ShopwareComponent}
 */
export default class CookieBar extends ShopwareComponent {
    static options = {
        groupsUrl: null,
        /** href of the core cookie link; clicks open the manager instead of navigating */
        linkHref: null,
        /** Privacy page of the bar text; the bar does not steal focus there (core parity) */
        privacyUrl: null,
        actionComponent: 'ViewsTheme:Cookie:Manager:Action',
        managerOpenEvent: 'ViewsTheme:Cookie:Manager:Open',
        managerCloseEvent: 'ViewsTheme:Cookie:Manager:Close',
        /** Open the cookie manager (e.g. "Cookie preferences" in the consent request) */
        managerRequestEvent: 'ViewsTheme:Cookie:Manager:Request',
        /** `{ featureName, cookieName }` — a feature asks for its cookie (e.g. wishlist) */
        requestEvent: 'ViewsTheme:Cookie:Consent:Request',
        /** Core `document.$emitter` event `{ route, cookieName }` (core plugins, apps); namespaced for unsubscribe */
        coreRequestEvent: 'CookieConfiguration/requestConsent.ViewsThemeCookieBar',
    }

    init() {
        this._busy = false
        this._visible = false
        /** Preference cookie is set, but not for this language / config: the bar must still be answered */
        this._needsConsent = false
        this._onClick = this._onClick.bind(this)
        this._onLinkClick = this._onLinkClick.bind(this)
        this._onManagerOpen = this._onManagerOpen.bind(this)
        this._onManagerClose = this._onManagerClose.bind(this)
        this._onRequest = this._onRequest.bind(this)
        this._onCoreRequest = this._onCoreRequest.bind(this)
        this.openManager = this.openManager.bind(this)
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
        window.Shopware.on(this.options.managerRequestEvent, this.openManager)
        window.Shopware.on(this.options.requestEvent, this._onRequest)
        document.$emitter?.subscribe?.(this.options.coreRequestEvent, this._onCoreRequest)

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
        window.Shopware.off(this.options.managerRequestEvent, this.openManager)
        window.Shopware.off(this.options.requestEvent, this._onRequest)
        document.$emitter?.unsubscribe?.(this.options.coreRequestEvent)
        this._setPadding(0)
    }

    show() {
        const wasVisible = this._visible

        this._visible = true
        this.el.dataset.visible = 'true'
        this._syncPadding()

        // Newly shown consent region: move focus there so keyboard / screen reader users notice it.
        if (!wasVisible && !this._isPrivacyPage()) {
            window.focusHandler?.setFocus(this.el, { preventScroll: true })
        }
    }

    hide() {
        this._visible = false
        this.el.dataset.visible = 'false'
        this._syncPadding()
    }

    /**
     * Public API — open the cookie manager (or, with `{ consent }`, a feature cookie request) through
     * the Action inside the bar. The bar is the single coordinator: other Actions (e.g. a footer
     * "Cookie settings" button) only handle their own clicks.
     *
     * @param {{ consent?: { featureName?: string, cookieName?: string } }} [options]
     */
    openManager(options = {}) {
        const actionEl = this.el.querySelector(`[data-component="${this.options.actionComponent}"]`)
        const action = getInstanceByElement(this.options.actionComponent, actionEl)

        if (!action) {
            console.error('CookieBar: no Cookie:Manager:Action inside the bar')
            return
        }

        void action.open(options)
    }

    /**
     * Drop outdated consent (the cookie configuration changed) and ask again; also ask when the
     * shared preference cookie comes from another language only.
     */
    async _verifyConfiguration() {
        const outcome = await checkConfigurationHash(this.options.groupsUrl)

        this._needsConsent = outcome === 'language'

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
                this._needsConsent = false
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
        this.openManager()
    }

    _onManagerOpen() {
        this.hide()
    }

    _onManagerClose() {
        if (!isPreferenceSet()) {
            this.show()
            return
        }

        // Closed without saving keeps the other language's preference cookie: check whether this
        // language got its consent (Save / Accept all store its hash) before hiding for good.
        if (this._needsConsent) {
            void this._verifyConfiguration()
        }
    }

    /**
     * @param {{ featureName?: string, cookieName?: string }} payload
     */
    _onRequest(payload) {
        this.openManager({ consent: payload })
    }

    /**
     * Core contract: `{ route, cookieName }`, `route` = `frontend.cookie.consent.offcanvas?featureName=…`.
     *
     * @param {CustomEvent|{ route?: string, cookieName?: string }} event
     */
    _onCoreRequest(event) {
        const detail = event instanceof CustomEvent ? event.detail : event
        if (!detail?.cookieName) {
            return
        }

        let featureName = null
        try {
            featureName = new URL(detail.route || '', window.location.origin).searchParams.get('featureName')
        } catch {
            // Invalid route: fall back to the default feature below.
        }

        this._onRequest({ featureName: featureName || undefined, cookieName: detail.cookieName })
    }

    /**
     * @returns {boolean}
     */
    _isPrivacyPage() {
        if (!this.options.privacyUrl || this.options.privacyUrl === '#') {
            return false
        }

        const normalize = (url) => url.origin + url.pathname.replace(/\/$/, '').toLowerCase()

        try {
            return normalize(new URL(window.location.href)) === normalize(new URL(this.options.privacyUrl, window.location.origin))
        } catch {
            return false
        }
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
