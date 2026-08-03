export default class FilterBoolean extends ShopwareComponent {
    static options = {
        name: null,
        displayName: null,
        listingComponent: 'ViewsTheme:Product:Listing',
    }

    init() {
        this._input = this.el.querySelector('input[type="checkbox"]')
        this._onChange = this._onChange.bind(this)
        this._input?.addEventListener('change', this._onChange)
    }

    destroy() {
        this._input?.removeEventListener('change', this._onChange)
    }

    getValues() {
        if (!this.options.name || !this._input?.checked) {
            return {}
        }

        return { [this.options.name]: '1' }
    }

    getParamKeys() {
        return this.options.name ? [this.options.name] : []
    }

    getLabels() {
        if (!this._input?.checked || !this.options.name) {
            return []
        }

        return [{ id: this.options.name, label: this.options.displayName || this.options.name }]
    }

    reset(id) {
        if (id === this.options.name && this._input) {
            this._input.checked = false
        }
    }

    resetAll() {
        if (this._input) {
            this._input.checked = false
            this._input.disabled = false
        }
        this.el.hidden = false
    }

    setFromUrl(params) {
        if (!this._input || !this.options.name) {
            return
        }

        this._input.checked = !!params?.[this.options.name]
    }

    applyAvailability(aggregations) {
        if (!this.options.name || !aggregations) {
            return
        }

        const bucket = aggregations[this.options.name]
        const max = Number(bucket?.max || 0)
        const unavailable = max <= 0 && !this._input?.checked

        this.el.hidden = false
        if (this._input) {
            this._input.disabled = unavailable
        }
    }

    /** @deprecated use applyAvailability */
    refreshDisabled(aggregations) {
        this.applyAvailability(aggregations)
    }

    _onChange() {
        window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: 1 }, { resetPage: false })
    }
}
