export default class FilterRating extends ShopwareComponent {
    static options = {
        name: 'rating',
        listingComponent: 'ViewsTheme:Product:Listing',
        groupComponent: 'ViewsTheme:Filter:Group',
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('change', this._onChange)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
        this.el.removeEventListener('click', this._onClick)
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
        this._group()?.setDisabled?.(false)
    }

    setFromUrl(params) {
        const value = params?.[this.options.name]
        this._inputs().forEach((input) => {
            input.checked = String(input.value) === String(value || '')
        })
    }

    applyAvailability(aggregations) {
        const max = Number(aggregations?.[this.options.name]?.max || 0)
        const selected = this._selected()
        const unavailable = max <= 0 && !selected

        this.el.hidden = false
        this._inputs().forEach((input) => {
            if (input.checked) {
                input.disabled = false
                return
            }
            if (unavailable) {
                input.disabled = true
                return
            }
            const points = Number(input.value)
            input.disabled = max > 0 && points > max
        })

        if (unavailable) {
            this._closeGroup()
        }
        this._group()?.setDisabled?.(unavailable)
    }

    /** @deprecated use applyAvailability */
    refreshDisabled(aggregations) {
        this.applyAvailability(aggregations)
    }

    _onClick(event) {
        const reset = event.target instanceof Element
            ? event.target.closest('[data-filter-reset]')
            : null
        if (!reset || !this.el.contains(reset)) {
            return
        }

        event.preventDefault()
        this.resetAll()
        this._closeGroup()
        window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: 1 }, { resetPage: false })
    }

    _selected() {
        return this._inputs().find((input) => input.checked) || null
    }

    _inputs() {
        return Array.from(this.el.querySelectorAll('input[type="radio"]'))
    }

    _onChange() {
        this._closeGroup()
        window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: 1 }, { resetPage: false })
    }

    _group() {
        const name = this.options.groupComponent || 'ViewsTheme:Filter:Group'
        const el = this.el.querySelector(`[data-component="${name}"]`)
        if (!el || !window.Shopware?.getComponentInstanceByElement) {
            return null
        }

        return window.Shopware.getComponentInstanceByElement(name, el)
    }

    _closeGroup() {
        this._group()?.close?.()
    }
}
