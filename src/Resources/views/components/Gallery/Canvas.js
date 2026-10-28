import { galleries, select } from '@views-theme/modules/gallery/store.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Scroll-snap canvas — goTo via scrollIntoView; settle via getBoundingClientRect;
 * resize re-pins current index (no scrollLeft).
 *
 * @extends {ThemeComponent}
 */
export default class GalleryCanvas extends ThemeComponent {
    static options = {
        galleryId: null,
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

        this.scope.on(track, 'scrollend', this._onScrollEnd, { passive: true })
        this.scope.on(track, 'scroll', this._onScroll, { passive: true })

        const observer = new ResizeObserver(this._onResize)
        observer.observe(track)
        this.scope.add(() => observer.disconnect())

        this.scope.effect(galleries.get(this.options.galleryId).index, (index) => {
            if (index !== this._index) {
                this.goTo(index)
            }
        })
    }

    destroy() {
        clearTimeout(this._scrollTimer)
        clearTimeout(this._progTimer)
        clearTimeout(this._resizeTimer)

        super.destroy()
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

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        // 'instant' is baseline; fall back to 'auto' where unsupported
        const scrollBehavior =
            reduceMotion || behavior === 'instant' || behavior === 'auto'
                ? 'auto'
                : 'smooth'

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
        clearTimeout(this._progTimer)
        this._programmatic = false
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
        select(this.options.galleryId, best)
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
