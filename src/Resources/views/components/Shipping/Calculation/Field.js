import { connect, select, values } from '@views-theme/modules/shipping/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * One shipping calculation select. Reads its own native control only; talks to
 * the rest through `shipping/store.js`.
 *
 * @extends {ThemeComponent}
 */
export default class ShippingCalculationField extends ThemeComponent {
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

        this.scope.add(connect(this.options.field, this._select.value))
        this.scope.watch(values, this._onValues)
        this.scope.on(this._select, 'change', this._onChange)
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
