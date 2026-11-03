/**
 * Fixed "back to top" button. Shows after `visibleFrom` px of scroll, scrolls to the top and
 * moves focus to `topElementId`.
 *
 * @extends {ShopwareComponent}
 */
export default class ScrollUp extends ShopwareComponent {
    static options = {
        visibleFrom: 250,
        topElementId: 'page-top',
    }

    init() {
        this._frame = null
        this._onScroll = this._onScroll.bind(this)
        this._onClick = this._onClick.bind(this)

        this._button = this.el.querySelector('button')

        window.addEventListener('scroll', this._onScroll, { passive: true })
        this._button?.addEventListener('click', this._onClick)

        this._syncVisibility()
    }

    destroy() {
        window.removeEventListener('scroll', this._onScroll)
        this._button?.removeEventListener('click', this._onClick)

        if (this._frame !== null) {
            cancelAnimationFrame(this._frame)
            this._frame = null
        }
    }

    _onScroll() {
        if (this._frame !== null) {
            return
        }

        this._frame = requestAnimationFrame(() => {
            this._frame = null
            this._syncVisibility()
        })
    }

    _onClick() {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })

        const top = document.getElementById(this.options.topElementId)
        if (top) {
            window.focusHandler?.setFocus(top, { preventScroll: true })
        }
    }

    _syncVisibility() {
        this.el.dataset.visible = window.scrollY > this.options.visibleFrom ? 'true' : 'false'
    }
}
