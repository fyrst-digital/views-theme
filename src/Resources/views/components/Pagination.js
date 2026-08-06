/**
 * @extends {ShopwareComponent}
 */
export default class Pagination extends ShopwareComponent {
    static options = {
        page: null,
        pageParameter: 'p',
    }

    init() {
        this._page = this._resolveInitialPage()
    }

    getValues() {
        const key = this.options.pageParameter || 'p'

        return { [key]: this._page }
    }

    getParamKeys() {
        return [this.options.pageParameter || 'p']
    }

    getLabels() {
        return []
    }

    reset() {}

    resetAll() {}

    setFromUrl(params) {
        const key = this.options.pageParameter || 'p'
        const raw = params?.[key]
        const page = raw === undefined || raw === null || raw === ''
            ? 1
            : Number(raw)

        this._page = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    }

    _resolveInitialPage() {
        if (this.options.page !== null && this.options.page !== undefined && this.options.page !== '') {
            const fromOptions = Number(this.options.page)
            if (Number.isFinite(fromOptions) && fromOptions > 0) {
                return Math.floor(fromOptions)
            }
        }

        const active = this.el.querySelector('[aria-current="page"]')
        if (active) {
            try {
                const options = JSON.parse(active.getAttribute('data-component-options') || '{}')
                const page = Number(options.page)
                if (Number.isFinite(page) && page > 0) {
                    return Math.floor(page)
                }
            } catch {
                // fall through
            }
        }

        return 1
    }
}
