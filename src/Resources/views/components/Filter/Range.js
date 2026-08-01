export default class FilterRange extends ShopwareComponent {
    static options = {
        minKey: 'min-price',
        maxKey: 'max-price',
        listingComponent: 'ViewsTheme:Product:Listing',
        debounce: 500,
    }

    init() {
        this._min = this.el.querySelector('input[data-range="min"]')
        this._max = this.el.querySelector('input[data-range="max"]')
        this._timer = null
        this._onInput = this._onInput.bind(this)
        this._min?.addEventListener('input', this._onInput)
        this._max?.addEventListener('input', this._onInput)
    }

    destroy() {
        this._min?.removeEventListener('input', this._onInput)
        this._max?.removeEventListener('input', this._onInput)
        if (this._timer) {
            window.clearTimeout(this._timer)
        }
    }

    getValues() {
        const values = {}
        if (this._min?.value) {
            values[this.options.minKey] = this._min.value
        }
        if (this._max?.value) {
            values[this.options.maxKey] = this._max.value
        }
        return values
    }

    getParamKeys() {
        return [this.options.minKey, this.options.maxKey].filter(Boolean)
    }

    getLabels() {
        const labels = []
        if (this._min?.value) {
            labels.push({ id: this.options.minKey, label: this._min.value })
        }
        if (this._max?.value) {
            labels.push({ id: this.options.maxKey, label: this._max.value })
        }
        return labels
    }

    reset(id) {
        if (id === this.options.minKey && this._min) {
            this._min.value = ''
        }
        if (id === this.options.maxKey && this._max) {
            this._max.value = ''
        }
    }

    resetAll() {
        if (this._min) {
            this._min.value = ''
        }
        if (this._max) {
            this._max.value = ''
        }
    }

    setFromUrl(params) {
        if (this._min) {
            this._min.value = params?.[this.options.minKey] || ''
        }
        if (this._max) {
            this._max.value = params?.[this.options.maxKey] || ''
        }
    }

    _onInput() {
        if (this._timer) {
            window.clearTimeout(this._timer)
        }
        this._timer = window.setTimeout(() => {
            window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: 1 }, { resetPage: false })
        }, this.options.debounce || 500)
    }
}
