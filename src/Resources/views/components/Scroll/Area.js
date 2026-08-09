/**
 * Scrollport with edge fades on the overflowing axis only.
 *
 * @extends {ShopwareComponent}
 */
export default class ScrollArea extends ShopwareComponent {
    init() {
        this._onScroll = this._syncScrollEdges.bind(this)
        this._resizeObserver = null

        this.el.addEventListener('scroll', this._onScroll, { passive: true })

        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver(() => {
                this._syncScrollEdges()
            })
            this._resizeObserver.observe(this.el)
        }

        requestAnimationFrame(() => {
            this._syncScrollEdges()
        })
    }

    destroy() {
        this.el.removeEventListener('scroll', this._onScroll)
        this._resizeObserver?.disconnect()
        this._resizeObserver = null
        this.el.removeAttribute('data-scroll-up')
        this.el.removeAttribute('data-scroll-down')
        this.el.removeAttribute('data-scroll-start')
        this.el.removeAttribute('data-scroll-end')
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
        const canStart = scrollLeft > 1
        const canEnd = scrollLeft + clientWidth < scrollWidth - 1

        this.el.dataset.scrollUp = canUp ? 'true' : 'false'
        this.el.dataset.scrollDown = canDown ? 'true' : 'false'
        this.el.dataset.scrollStart = canStart ? 'true' : 'false'
        this.el.dataset.scrollEnd = canEnd ? 'true' : 'false'
    }
}
