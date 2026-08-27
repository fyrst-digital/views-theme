/**
 * Toggles footer column content on small viewports via aria-expanded.
 * State SoT is ARIA (`aria-expanded`) + content `inert`; look follows CSS.
 * From collapseUntil up, CSS forces content open — inert stays off even when
 * aria-expanded is false.
 *
 * @extends {ShopwareComponent}
 */
export default class FooterColumn extends ShopwareComponent {
    static options = {
        /**
         * Partial overlay of `window.breakpoints` (`{ sm: 520, md: 768, … }`).
         * `null` uses Shopware’s map only.
         *
         * @type {Record<string, number>|null}
         */
        breakpoints: null,
    }

    init() {
        this._toggle = this.el.querySelector('button[aria-expanded]')
        if (!this._toggle) {
            return
        }

        const contentId = this._toggle.getAttribute('aria-controls')
        this._content = contentId ? document.getElementById(contentId) : null

        this._onClick = this._handleClick.bind(this)
        this._toggle.addEventListener('click', this._onClick)

        const query = this._forcedOpenQuery(this.el.getAttribute('data-collapse-until'))
        if (query) {
            this._mql = window.matchMedia(query)
            this._onMql = this._syncInert.bind(this)
            this._mql.addEventListener('change', this._onMql)
        }

        this._syncInert()
    }

    destroy() {
        this._toggle?.removeEventListener('click', this._onClick)
        this._mql?.removeEventListener('change', this._onMql)
        this._toggle = null
        this._content = null
        this._onClick = null
        this._mql = null
        this._onMql = null
    }

    _handleClick() {
        const expanded = this._toggle.getAttribute('aria-expanded') === 'true'
        this._toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true')
        this._syncInert()
    }

    _syncInert() {
        if (!this._content) {
            return
        }

        const forcedOpen = this._mql?.matches === true
        const expanded = this._toggle.getAttribute('aria-expanded') === 'true'
        this._content.inert = !(forcedOpen || expanded)
    }

    /**
     * @param {string|null} until
     * @returns {string|null}
     */
    _forcedOpenQuery(until) {
        const px = this._breakpointPx(until)
        if (px === null) {
            return null
        }

        return `(width >= ${px}px)`
    }

    /**
     * @param {string|null} until
     * @returns {number|null}
     */
    _breakpointPx(until) {
        if (!until) {
            return null
        }

        const token = until.toLowerCase()
        const overlay = this.options.breakpoints
        const raw = overlay?.[token] ?? window.breakpoints?.[token]
        const px = Number(raw)

        return Number.isFinite(px) ? px : null
    }
}
