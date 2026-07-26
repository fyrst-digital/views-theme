export default class LanguageFlag extends ShopwareComponent {
    static options = {
        fallbackSrc: null,
    }

    init() {
        this._triedFallback = false
        this._onError = this._onError.bind(this)
        this.el.addEventListener('error', this._onError)

        if (this.el.complete && this.el.naturalWidth === 0) {
            this._onError()
        }
    }

    destroy() {
        this.el.removeEventListener('error', this._onError)
    }

    _onError() {
        const fallback = this.options.fallbackSrc

        if (fallback && !this._triedFallback) {
            this._triedFallback = true
            this.el.src = fallback
            return
        }

        this.el.remove()
    }
}
