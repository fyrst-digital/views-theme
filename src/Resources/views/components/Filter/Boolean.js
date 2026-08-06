import { applyListing } from '@views-theme/modules/listing/apply.js'

/**
 * @extends {ShopwareComponent}
 */
export default class FilterBoolean extends ShopwareComponent {
    static options = {
        name: null,
        displayName: null,
        listingComponent: 'ViewsTheme:Product:Listing',
    }

    init() {
        /** @type {HTMLInputElement|null} */
        this._input = this.el.querySelector('input[type="checkbox"]')
        this._onChange = this._onChange.bind(this)
        this._input?.addEventListener('change', this._onChange)
        if (this.options.name) {
            this.el.setAttribute('data-filter-key', this.options.name)
        }
    }

    destroy() {
        this._input?.removeEventListener('change', this._onChange)
    }

    /**
     * @returns {Record<string, unknown>}
     */
    getValues() {
        if (!this.options.name || !this._input?.checked) {
            return {}
        }

        return { [this.options.name]: '1' }
    }

    /**
     * @returns {string[]}
     */
    getParamKeys() {
        return this.options.name ? [this.options.name] : []
    }

    /**
     * @returns {import('@views-theme/modules/types.js').ListingLabel[]}
     */
    getLabels() {
        if (!this._input?.checked || !this.options.name) {
            return []
        }

        return [{ id: this.options.name, label: this.options.displayName || this.options.name }]
    }

    /**
     * @param {string} id
     */
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

    /**
     * @param {Record<string, string>} params
     */
    setFromUrl(params) {
        if (!this._input || !this.options.name) {
            return
        }

        const next = !!params?.[this.options.name]
        if (this._input.checked !== next) {
            this._input.checked = next
        }
    }

    /**
     * @param {{ disabled?: boolean, checked?: boolean }} meta
     */
    applyOptionsMeta(meta) {
        if (!meta || typeof meta !== 'object') {
            return
        }

        this.el.hidden = false
        if (this._input) {
            if (meta.checked !== undefined) {
                const next = !!meta.checked
                if (this._input.checked !== next) {
                    this._input.checked = next
                }
            }
            this._input.disabled = !!meta.disabled
        }
    }

    /**
     * @param {object} aggregations
     */
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

    _onChange() {
        applyListing({}, { listingComponent: this.options.listingComponent })
    }
}
