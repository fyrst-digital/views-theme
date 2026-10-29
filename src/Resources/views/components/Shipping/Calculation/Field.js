import { connect, select, values } from '@views-theme/modules/shipping/store.js'

/**
 * One shipping calculation select. Reads its own native control only; talks to
 * the rest through `shipping/store.js`.
 *
 * @extends {ShopwareComponent}
 */
export default class ShippingCalculationField extends ShopwareComponent {
    static options = {
        field: null,
    }

    init() {
        this._select = this.el.querySelector('select')
        if (!(this._select instanceof HTMLSelectElement) || !this.options.field) {
            return
        }

        this._onChange = this._onChange.bind(this)
        this._onValues = this._onValues.bind(this)

        this._disconnect = connect(this.options.field, this._select.value)
        this._unsubscribe = values.subscribe(this._onValues)
        this._select.addEventListener('change', this._onChange)
    }

    destroy() {
        this._select?.removeEventListener('change', this._onChange)
        this._unsubscribe?.()
        this._disconnect?.()
    }

    _onChange() {
        select(this.options.field, this._select.value, this.el)
    }

    /**
     * @param {import('@views-theme/modules/shipping/store.js').ShippingValues} next
     */
    _onValues(next) {
        const value = next[this.options.field]
        if (value != null && this._select.value !== value) {
            this._select.value = value
        }
    }
}
