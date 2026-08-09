/**
 * Scroll-snap canvas track — goTo(index) + report active slide to Gallery.
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

        const track = this._track()
        if (!track) {
            return
        }

        track.addEventListener('scrollend', this._onScrollEnd, { passive: true })
        track.addEventListener('scroll', this._onScroll, { passive: true })
    }

    destroy() {
        const track = this._track()
        if (track) {
            track.removeEventListener('scrollend', this._onScrollEnd)
            track.removeEventListener('scroll', this._onScroll)
        }
        clearTimeout(this._scrollTimer)
        clearTimeout(this._progTimer)
    }

    /**
     * @param {number} index
     */
    goTo(index) {
        const slides = this._slides()
        const slide = slides[index]
        const track = this._track()
        if (!slide || !track) {
            return
        }

        this._programmatic = true
        this._index = index

        const left = slide.offsetLeft - track.offsetLeft
        track.scrollTo({ left, behavior: 'smooth' })

        clearTimeout(this._progTimer)
        this._progTimer = setTimeout(() => {
            this._programmatic = false
        }, 450)
    }

    _onScroll() {
        // Debounced fallback for browsers without reliable scrollend.
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
            this._programmatic = false
            return
        }

        const track = this._track()
        const slides = this._slides()
        if (!track || !slides.length) {
            return
        }

        const center = track.scrollLeft + track.clientWidth / 2
        let best = 0
        let bestDist = Infinity

        slides.forEach((slide, i) => {
            const mid = slide.offsetLeft + slide.offsetWidth / 2
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
