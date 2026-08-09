/**
 * Scroll-snap canvas — goTo via scrollIntoView; settle via getBoundingClientRect;
 * resize re-pins current index (no scrollLeft).
 *
 * @extends {ShopwareComponent}
 */
export default class GalleryCanvas extends ShopwareComponent {
    static options = {
        galleryComponent: 'ViewsTheme:Gallery',
        slideComponent: 'ViewsTheme:Gallery:Slide',
    }

    init() {
        this._index = 0
        this._programmatic = false
        this._onScrollEnd = this._onScrollEnd.bind(this)
        this._onScroll = this._onScroll.bind(this)
        this._onResize = this._onResize.bind(this)

        const track = this._track()
        if (!track) {
            return
        }

        track.addEventListener('scrollend', this._onScrollEnd, { passive: true })
        track.addEventListener('scroll', this._onScroll, { passive: true })

        this._resizeObserver = new ResizeObserver(this._onResize)
        this._resizeObserver.observe(track)
    }

    destroy() {
        const track = this._track()
        if (track) {
            track.removeEventListener('scrollend', this._onScrollEnd)
            track.removeEventListener('scroll', this._onScroll)
        }
        this._resizeObserver?.disconnect()
        this._resizeObserver = null
        clearTimeout(this._scrollTimer)
        clearTimeout(this._progTimer)
        clearTimeout(this._resizeTimer)
    }

    /**
     * @param {number} index
     * @param {{ behavior?: ScrollBehavior }} [options]
     */
    goTo(index, { behavior = 'smooth' } = {}) {
        const slide = this._slides()[index]
        if (!slide) {
            return
        }

        this._programmatic = true
        this._index = index

        // 'instant' is baseline; fall back to 'auto' where unsupported
        const scrollBehavior =
            behavior === 'instant' || behavior === 'auto' ? 'auto' : 'smooth'

        slide.scrollIntoView({
            behavior: scrollBehavior,
            block: 'nearest',
            inline: 'start',
        })

        this._releaseProgrammatic(scrollBehavior)
    }

    /**
     * @param {string} behavior
     */
    _releaseProgrammatic(behavior) {
        clearTimeout(this._progTimer)

        if (behavior === 'smooth') {
            this._progTimer = setTimeout(() => {
                this._programmatic = false
            }, 450)
            return
        }

        // auto / instant: clear after layout frames
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this._programmatic = false
            })
        })
    }

    _onResize() {
        clearTimeout(this._resizeTimer)
        this._resizeTimer = setTimeout(() => {
            this.goTo(this._index, { behavior: 'instant' })
        }, 50)
    }

    _onScroll() {
        clearTimeout(this._scrollTimer)
        this._scrollTimer = setTimeout(() => {
            this._settle()
        }, 80)
    }

    _onScrollEnd() {
        clearTimeout(this._scrollTimer)
        this._settle()
    }

    _settle() {
        if (this._programmatic) {
            return
        }

        const track = this._track()
        const slides = this._slides()
        if (!track || !slides.length) {
            return
        }

        const root = track.getBoundingClientRect()
        const center = root.left + root.width / 2
        let best = 0
        let bestDist = Infinity

        slides.forEach((slide, i) => {
            const rect = slide.getBoundingClientRect()
            const mid = rect.left + rect.width / 2
            const dist = Math.abs(mid - center)
            if (dist < bestDist) {
                bestDist = dist
                best = i
            }
        })

        if (best === this._index) {
            return
        }

        this._index = best
        window.Shopware.callMethod(
            this.options.galleryComponent,
            'setIndex',
            best,
        )
    }

    /**
     * @returns {HTMLElement|null}
     */
    _track() {
        const slides = this._slides()
        return slides[0]?.parentElement || null
    }

    /**
     * @returns {HTMLElement[]}
     */
    _slides() {
        return Array.from(
            this.el.querySelectorAll(
                `[data-component="${this.options.slideComponent}"]`,
            ),
        )
    }
}
