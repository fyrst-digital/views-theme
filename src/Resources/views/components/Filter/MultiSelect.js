export default class FilterMultiSelect extends ShopwareComponent {
    static options = {
        name: null,
        propertyName: null,
        filterKey: null,
        listingComponent: 'ViewsTheme:Product:Listing',
        groupComponent: 'ViewsTheme:Filter:Group',
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('change', this._onChange)
        this.el.addEventListener('click', this._onClick)
        this._syncCount()
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
        this.el.removeEventListener('click', this._onClick)
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
        this._group()?.setDisabled?.(false)
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

    /**
     * Replace option list HTML from server batch (order + disabled baked in).
     * Keeps the existing <ul> (host options:class / SSR attrs); swaps children only.
     */
    replaceOptions(html) {
        if (typeof html !== 'string' || html === '') {
            return
        }

        const existing = this.el.querySelector('[data-filter-options]')
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        const next = template.content.firstElementChild
        if (!next) {
            return
        }

        if (existing) {
            existing.replaceChildren(...next.children)
        } else {
            const group = this.el.querySelector(
                `[data-component="${this.options.groupComponent || 'ViewsTheme:Filter:Group'}"]`,
            )
            const body = group?.querySelector('.vi-filter-group-body')
            const footer = body?.querySelector('.vi-filter-group-body__footer')
            if (footer) {
                footer.before(next)
            } else {
                body?.append(next)
            }
        }

        this._syncCount()
    }

    /**
     * @param {{ disabled?: boolean, count?: number }} meta
     */
    applyOptionsMeta(meta) {
        if (!meta || typeof meta !== 'object') {
            return
        }

        this._group()?.setDisabled?.(!!meta.disabled)
        if (meta.count !== undefined && meta.count !== null) {
            this._group()?.setCount?.(meta.count || null)
        } else {
            this._syncCount()
        }
    }

    /**
     * Fallback when filter-options batch is unavailable.
     */
    applyAvailability(aggregations) {
        if (!aggregations || !this.options.name) {
            return
        }

        const bucket = aggregations[this.options.name]
        let allowedIds = []

        if (this.options.propertyName && bucket?.entities) {
            const group = Object.values(bucket.entities).find((entity) => {
                if (entity?.id === this.options.propertyName) {
                    return true
                }
                const name = entity?.translated?.name || entity?.name
                return name === this.options.propertyName
            })
            const options = group?.options || {}
            allowedIds = Object.values(options).map((option) => option.id).filter(Boolean)
        } else if (bucket?.entities) {
            allowedIds = Object.values(bucket.entities).map((entity) => entity.id).filter(Boolean)
        }

        const checked = this._checked()
        const unavailable = !allowedIds.length && !checked.length
        const unlockGroup = !!this.options.propertyName && checked.length > 0

        this.el.hidden = false
        this._inputs().forEach((input) => {
            if (input.checked || unlockGroup) {
                input.disabled = false
                return
            }
            input.disabled = !allowedIds.includes(input.value)
        })

        this._sortOptionsAvailableFirst()

        if (unavailable) {
            this._closeGroup()
        }
        this._group()?.setDisabled?.(unavailable)
    }

    /** @deprecated use applyAvailability */
    refreshDisabled(aggregations) {
        this.applyAvailability(aggregations)
    }

    _sortOptionsAvailableFirst() {
        const list = this.el.querySelector('[data-filter-options]')
        if (!list) {
            return
        }

        const items = Array.from(list.children).filter((node) => node instanceof HTMLElement)
        if (items.length < 2) {
            return
        }

        const available = []
        const disabled = []
        items.forEach((item) => {
            const input = item.querySelector('input[type="checkbox"]')
            if (input && !input.disabled) {
                available.push(item)
            } else {
                disabled.push(item)
            }
        })

        ;[...available, ...disabled].forEach((item) => {
            list.appendChild(item)
        })
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

    _onChange() {
        this._syncCount()
        this._closeGroup()
        window.Shopware.callMethod(this.options.listingComponent, 'apply', { p: 1 }, { resetPage: false })
    }

    _checked() {
        return this._inputs().filter((input) => input.checked)
    }

    _inputs() {
        return Array.from(this.el.querySelectorAll('input[type="checkbox"]'))
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

    _syncCount() {
        const count = this._checked().length
        this._group()?.setCount?.(count || null)
    }
}
