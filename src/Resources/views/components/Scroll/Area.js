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
    }

    _syncScrollEdges() {
        const { scrollTop, clientHeight, scrollHeight } = this.el
        const canUp = scrollTop > 1
        const canDown = scrollTop + clientHeight < scrollHeight - 1

        this.el.dataset.scrollUp = canUp ? 'true' : 'false'
        this.el.dataset.scrollDown = canDown ? 'true' : 'false'
    }
}
