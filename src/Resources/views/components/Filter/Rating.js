export default class FilterRating extends ShopwareComponent {
    static options = {
        name: 'rating',
        listingComponent: 'ViewsTheme:Product:Listing',
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this.el.addEventListener('change', this._onChange)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
    }

    getValues() {
        const selected = this._selected()
        if (!selected || !this.options.name) {
            return {}
        }

        return { [this.options.name]: selected.value }
    }

    getParamKeys() {
        return this.options.name ? [this.options.name] : []
    }

    getLabels() {
        const selected = this._selected()
        if (!selected) {
            return []
        }

        return [{ id: this.options.name, label: selected.getAttribute('data-label') || selected.value }]
    }

    reset(id) {
        if (id !== this.options.name) {
            return
        }
        this._inputs().forEach((input) => {
            input.checked = false
        })
    }

    resetAll() {
        this._inputs().forEach((input) => {
            input.checked = false
            input.disabled = false
        })
        this.el.hidden = false
    }

    setFromUrl(params) {
        const value = params?.[this.options.name]
        this._inputs().forEach((input) => {
            input.checked = String(input.value) === String(value || '')
        })
    }

    refreshDisabled(aggregations) {
        const max = Number(aggregations?.[this.options.name]?.max || 0)
        if (max <= 0 && !this._selected()) {
            this.el.hidden = true
            return
        }

        this.el.hidden = false
        this._inputs().forEach((input) => {
            const points = Number(input.value)
            input.disabled = max > 0 && points > max && !input.checked
        })
    }

    _selected() {
        return this._inputs().find((input) => input.checked) || null
    }

    _inputs() {
        return Array.from(this.el.querySelectorAll('input[type="radio"]'))
    }

    _onChange() {
        window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: 1 }, { resetPage: false })
    }
}
