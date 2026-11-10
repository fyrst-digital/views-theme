import { nearestIndex, pageTarget, scrollEdges } from '@views-theme/modules/shared/scroll.js'

/** Fallback release of the programmatic gate when `scrollend` never fires. */
const PROGRAMMATIC_TIMEOUT = 450

/** Settle delay after the last `scroll` (browsers without `scrollend`). */
const SETTLE_DELAY = 80

/** Debounce for re-pinning the current item after a track resize. */
const RESIZE_DELAY = 50

/**
 * Scroll-snap carousel owner. Native scrolling (touch, trackpad, keyboard on
 * the focusable track) does the work; JS pages prev/next, scrolls to an item
 * (`goTo`), tracks the snapped item index, keeps it in place on resize and
 * keeps the controls' `disabled` state + host `data-overflow` in sync.
 *
 * After a **user** scroll settles on a new item it emits `changeEvent`
 * `{ el, index }`. Programmatic `goTo` scrolls never emit.
 *
 * @extends {ShopwareComponent}
 */
export default class Carousel extends ShopwareComponent {
    static options = {
        rewind: false,
        carouselComponent: 'ViewsTheme:Carousel',
        itemComponent: 'ViewsTheme:Carousel:Item',
        controlComponent: 'ViewsTheme:Carousel:Control',
        changeEvent: 'ViewsTheme:Carousel:Change',
    }

    init() {
        this._frame = 0
        this._index = 0
        this._width = 0
        this._programmatic = false
        this._releaseFrame = 0
        this._programmaticTimer = 0
        this._settleTimer = 0
        this._resizeTimer = 0
        this._resizeObserver = null
        this._hasScrollEnd = 'onscrollend' in window
        this._onScroll = this._onScroll.bind(this)
        this._onScrollEnd = this._onScrollEnd.bind(this)
        this._onResize = this._onResize.bind(this)
        this._sync = this._sync.bind(this)

        this._trackEl = this._items()[0]?.parentElement || null
        if (!this._trackEl) {
            this.el.dataset.overflow = 'false'
            return
        }

        // Width at mount: the observer's first callback must not re-pin (0 while hidden, so showing re-pins)
        this._width = this._trackEl.clientWidth

        this._trackEl.addEventListener('scroll', this._onScroll, { passive: true })
        this._trackEl.addEventListener('scrollend', this._onScrollEnd, { passive: true })

        // Also fires when a hidden ancestor (tab pane) is shown: 0 → real width
        this._resizeObserver = new ResizeObserver(this._onResize)
        this._resizeObserver.observe(this._trackEl)

        this._sync()
    }

    destroy() {
        cancelAnimationFrame(this._frame)
        cancelAnimationFrame(this._releaseFrame)
        clearTimeout(this._programmaticTimer)
        clearTimeout(this._settleTimer)
        clearTimeout(this._resizeTimer)
        this._resizeObserver?.disconnect()
        this._resizeObserver = null

        if (this._trackEl) {
            this._trackEl.removeEventListener('scroll', this._onScroll)
            this._trackEl.removeEventListener('scrollend', this._onScrollEnd)
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
     * Scroll item N to the track start (clamped to the scroll end). Sets the
     * current index without emitting `changeEvent`.
     *
     * @param {number} index 0-based item index
     * @param {{ behavior?: 'smooth'|'instant' }} [options] `instant` jumps (resize re-pin)
     */
    goTo(index, { behavior = 'smooth' } = {}) {
        const i = Number(index)
        const track = this._trackEl
        if (!track || !this._items()[i]) {
            return
        }

        this._index = i

        // Hidden (display: none ancestor): the resize re-pin scrolls once shown
        if (!track.clientWidth) {
            return
        }

        // Pinned at this width: the resize observer re-pins only when it changes
        this._width = track.clientWidth

        const { max } = scrollEdges(track)
        const target = Math.min(max, this._itemEdges()[i].start)
        const scrollBehavior = behavior === 'instant' ? 'instant' : this._behavior()

        this._programmatic = true
        track.scrollTo({
            left: this._isRtl() ? -target : target,
            behavior: scrollBehavior,
        })
        this._releaseProgrammatic(scrollBehavior)
    }

    /**
     * @returns {number} Current 0-based item index (last `goTo` or settled user scroll)
     */
    getIndex() {
        return this._index
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
            items: this._itemEdges(),
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
     * Logical item edges: distance from the track's inline start at scroll 0.
     * Layout offsets (the track is `position-relative`, so it is the items'
     * offsetParent) do not depend on the current scroll position or on
     * transforms, so they stay right while a smooth scroll is in flight.
     *
     * @returns {{ start: number, end: number }[]}
     */
    _itemEdges() {
        const track = this._trackEl
        const rtl = this._isRtl()

        return this._items().map((item) => {
            const width = item.offsetWidth
            const start = rtl ? track.clientWidth - item.offsetLeft - width : item.offsetLeft

            return { start, end: start + width }
        })
    }

    /**
     * Gate `_settle` while a `goTo` scroll runs, so its intermediate positions
     * never change the index. `scrollend` releases it early, so a user swipe
     * that interrupts a smooth scroll still settles; the timeout is a fallback.
     *
     * @param {ScrollBehavior} behavior
     */
    _releaseProgrammatic(behavior) {
        clearTimeout(this._programmaticTimer)
        cancelAnimationFrame(this._releaseFrame)

        if (behavior === 'smooth') {
            this._programmaticTimer = setTimeout(() => {
                this._programmatic = false
            }, PROGRAMMATIC_TIMEOUT)
            return
        }

        // auto / instant: release after the scroll has been laid out
        this._releaseFrame = requestAnimationFrame(() => {
            this._releaseFrame = requestAnimationFrame(() => {
                this._programmatic = false
            })
        })
    }

    _onScroll() {
        cancelAnimationFrame(this._frame)
        this._frame = requestAnimationFrame(this._sync)

        if (!this._hasScrollEnd) {
            clearTimeout(this._settleTimer)
            this._settleTimer = setTimeout(() => this._settle(), SETTLE_DELAY)
        }
    }

    _onScrollEnd() {
        clearTimeout(this._settleTimer)
        clearTimeout(this._programmaticTimer)
        cancelAnimationFrame(this._releaseFrame)
        this._programmatic = false
        this._sync()
        this._settle()
    }

    _onResize() {
        this._sync()

        const width = this._trackEl?.clientWidth || 0
        if (!width || width === this._width) {
            return
        }

        // Width changed (resize, orientation, hidden pane shown): keep the current item in place
        this._width = width
        clearTimeout(this._resizeTimer)
        this._resizeTimer = setTimeout(() => {
            this.goTo(this._index, { behavior: 'instant' })
        }, RESIZE_DELAY)
    }

    /**
     * After a user scroll: adopt the snapped item and emit `changeEvent` when it changed.
     */
    _settle() {
        const track = this._trackEl
        if (this._programmatic || !track || !track.clientWidth) {
            return
        }

        const { x } = scrollEdges(track)
        const index = nearestIndex(this._itemEdges(), x)
        if (index < 0 || index === this._index) {
            return
        }

        this._index = index
        window.Shopware.emit(this.options.changeEvent, { el: this.el, index })
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
