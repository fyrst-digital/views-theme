import { pageTarget, scrollEdges } from '@views-theme/modules/shared/scroll.js'

/**
 * Scroll-snap carousel owner. Native scrolling (touch, trackpad, keyboard on
 * the focusable track) does the work; JS only pages prev/next, `goTo(index)`
 * and keeps the controls' `disabled` state + host `data-overflow` in sync.
 *
 * @extends {ShopwareComponent}
 */
export default class Carousel extends ShopwareComponent {
    static options = {
        rewind: false,
        carouselComponent: 'ViewsTheme:Carousel',
        itemComponent: 'ViewsTheme:Carousel:Item',
        controlComponent: 'ViewsTheme:Carousel:Control',
    }

    init() {
        this._frame = 0
        this._resizeObserver = null
        this._onScroll = this._onScroll.bind(this)
        this._sync = this._sync.bind(this)

        this._trackEl = this._items()[0]?.parentElement || null
        if (!this._trackEl) {
            this.el.dataset.overflow = 'false'
            return
        }

        this._trackEl.addEventListener('scroll', this._onScroll, { passive: true })
        this._trackEl.addEventListener('scrollend', this._sync, { passive: true })

        // Also fires when a hidden ancestor (tab pane) is shown: 0 → real width
        this._resizeObserver = new ResizeObserver(this._sync)
        this._resizeObserver.observe(this._trackEl)

        this._sync()
    }

    destroy() {
        cancelAnimationFrame(this._frame)
        this._resizeObserver?.disconnect()
        this._resizeObserver = null

        if (this._trackEl) {
            this._trackEl.removeEventListener('scroll', this._onScroll)
            this._trackEl.removeEventListener('scrollend', this._sync)
        }
        this._trackEl = null
    }

    prev() {
        this._page('prev')
    }

    next() {
        this._page('next')
    }

    /**
     * @param {number} index 0-based item index
     */
    goTo(index) {
        const item = this._items()[Number(index)]
        if (!item) {
            return
        }

        item.scrollIntoView({
            behavior: this._behavior(),
            block: 'nearest',
            inline: 'start',
        })
    }

    /**
     * @param {'prev'|'next'} direction
     */
    _page(direction) {
        const track = this._trackEl
        if (!track) {
            return
        }

        const edges = scrollEdges(track)
        const target = pageTarget({
            x: edges.x,
            max: edges.max,
            viewport: track.clientWidth,
            items: this._itemEdges(edges.x),
            direction,
            rewind: this._rewind(),
        })

        if (target === null) {
            return
        }

        track.scrollTo({
            left: this._isRtl() ? -target : target,
            behavior: this._behavior(),
        })
    }

    /**
     * Logical item edges (distance from the track's inline start, scroll included).
     *
     * @param {number} x Current logical scroll offset
     * @returns {{ start: number, end: number }[]}
     */
    _itemEdges(x) {
        const rtl = this._isRtl()
        const box = this._trackEl.getBoundingClientRect()

        return this._items().map((item) => {
            const rect = item.getBoundingClientRect()
            const start = rtl ? box.right - rect.right : rect.left - box.left

            return { start: start + x, end: start + rect.width + x }
        })
    }

    _onScroll() {
        cancelAnimationFrame(this._frame)
        this._frame = requestAnimationFrame(this._sync)
    }

    _sync() {
        const track = this._trackEl
        if (!track) {
            return
        }

        // Hidden (display: none ancestor): keep the last state until it is shown
        if (!track.clientWidth) {
            return
        }

        const { overflow, atStart, atEnd } = scrollEdges(track)
        const rewind = this._rewind() && overflow

        this.el.dataset.overflow = overflow ? 'true' : 'false'

        for (const control of this._controls()) {
            const isPrev = this._direction(control) === 'prev'
            const disabled = !rewind && (isPrev ? atStart : atEnd)

            control.disabled = disabled
            control.setAttribute('aria-disabled', disabled ? 'true' : 'false')
        }
    }

    /**
     * @returns {ScrollBehavior}
     */
    _behavior() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    }

    /**
     * @returns {boolean}
     */
    _isRtl() {
        return getComputedStyle(this._trackEl).direction === 'rtl'
    }

    /**
     * @returns {boolean}
     */
    _rewind() {
        return this.options.rewind === true || this.options.rewind === 'true'
    }

    /**
     * @param {HTMLElement} control
     * @returns {string}
     */
    _direction(control) {
        try {
            return String(JSON.parse(control.getAttribute('data-component-options') || '{}').direction || 'next')
        } catch {
            return 'next'
        }
    }

    /**
     * @returns {HTMLElement[]}
     */
    _items() {
        return this._own(this.options.itemComponent)
    }

    /**
     * @returns {HTMLButtonElement[]}
     */
    _controls() {
        return this._own(this.options.controlComponent)
    }

    /**
     * Descendants of this carousel only — nested carousels own their parts.
     *
     * @param {string} name
     * @returns {HTMLElement[]}
     */
    _own(name) {
        return Array.from(this.el.querySelectorAll(`[data-component="${name}"]`)).filter(
            (el) => el.closest(`[data-component="${this.options.carouselComponent}"]`) === this.el,
        )
    }
}
