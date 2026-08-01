export default class FilterMultiSelect extends ShopwareComponent {
    static options = {
        name: null,
        propertyName: null,
        listingComponent: 'ViewsTheme:Product:Listing',
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this.el.addEventListener('change', this._onChange)
        this._syncCount()
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
    }

    getValues() {
        const checked = this._checked()
        if (!checked.length || !this.options.name) {
            return {}
        }

        return { [this.options.name]: checked.map((input) => input.value) }
    }

    getParamKeys() {
        return this.options.name ? [this.options.name] : []
    }

    getLabels() {
        return this._checked().map((input) => ({
            id: input.value,
            label: input.getAttribute('data-label') || input.value,
            previewHex: input.getAttribute('data-preview-hex') || null,
            previewImageUrl: input.getAttribute('data-preview-image-url') || null,
        }))
    }

    reset(id) {
        this._inputs().forEach((input) => {
            if (input.value === id) {
                input.checked = false
            }
        })
        this._syncCount()
    }

    resetAll() {
        this._inputs().forEach((input) => {
            input.checked = false
            input.disabled = false
        })
        this._syncCount()
    }

    setFromUrl(params) {
        if (!this.options.name) {
            return
        }

        const raw = params?.[this.options.name]
        const selected = typeof raw === 'string' && raw !== '' ? raw.split('|') : []
        this._inputs().forEach((input) => {
            input.checked = selected.includes(input.value)
        })
        this._syncCount()
    }

    refreshDisabled(aggregations) {
        if (!aggregations || !this.options.name) {
            return
        }

        const bucket = aggregations[this.options.name]
        let allowedIds = []

        if (this.options.propertyName && bucket?.entities) {
            const group = Object.values(bucket.entities).find((entity) => {
                const name = entity?.translated?.name || entity?.name
                return name === this.options.propertyName
            })
            const options = group?.options || {}
            allowedIds = Object.values(options).map((option) => option.id).filter(Boolean)
        } else if (bucket?.entities) {
            allowedIds = Object.values(bucket.entities).map((entity) => entity.id).filter(Boolean)
        }

        if (!allowedIds.length && !this._checked().length) {
            this.el.hidden = true
            return
        }

        this.el.hidden = false
        this._inputs().forEach((input) => {
            if (input.checked) {
                input.disabled = false
                return
            }
            input.disabled = allowedIds.length > 0 && !allowedIds.includes(input.value)
        })
    }

    _onChange() {
        this._syncCount()
        window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: 1 }, { resetPage: false })
    }

    _checked() {
        return this._inputs().filter((input) => input.checked)
    }

    _inputs() {
        return Array.from(this.el.querySelectorAll('input[type="checkbox"]'))
    }

    _syncCount() {
        const count = this._checked().length
        const group = this.el.querySelector('[data-component="ViewsTheme:Filter:Group"]')
        const instance = group && window.Shopware
            ? window.Shopware.getComponentInstanceByElement('ViewsTheme:Filter:Group', group)
            : null
        instance?.setCount?.(count || null)
    }
}
