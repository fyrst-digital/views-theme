import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Scrollport with edge fades on the overflowing axis only.
 *
 * @extends {ThemeComponent}
 */
export default class ScrollArea extends ThemeComponent {
    init() {
        this._onScroll = this._syncScrollEdges.bind(this)

        this.scope.on(this.el, 'scroll', this._onScroll, { passive: true })

        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(() => {
                this._syncScrollEdges()
            })
            observer.observe(this.el)
            this.scope.add(() => observer.disconnect())
        }

        requestAnimationFrame(() => {
            this._syncScrollEdges()
        })
    }

    destroy() {
        this.el.removeAttribute('data-scroll-up')
        this.el.removeAttribute('data-scroll-down')
        this.el.removeAttribute('data-scroll-start')
        this.el.removeAttribute('data-scroll-end')

        super.destroy()
    }

    /** Re-read edges (e.g. after programmatic scroll or content size change). */
    sync() {
        this._syncScrollEdges()
    }

    _syncScrollEdges() {
        const {
            scrollTop,
            clientHeight,
            scrollHeight,
            scrollLeft,
            clientWidth,
            scrollWidth,
        } = this.el

        const canUp = scrollTop > 1
        const canDown = scrollTop + clientHeight < scrollHeight - 1

        // abs() covers LTR and Firefox RTL (negative scrollLeft)
        const maxX = Math.max(0, scrollWidth - clientWidth)
        const x = Math.min(Math.abs(scrollLeft), maxX)
        const canStart = x > 1
        const canEnd = x < maxX - 1

        this.el.dataset.scrollUp = canUp ? 'true' : 'false'
        this.el.dataset.scrollDown = canDown ? 'true' : 'false'
        this.el.dataset.scrollStart = canStart ? 'true' : 'false'
        this.el.dataset.scrollEnd = canEnd ? 'true' : 'false'
    }
}
