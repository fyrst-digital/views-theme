import { apply, connectControl } from '@views-theme/modules/listing/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Listing control: sort order select.
 *
 * @extends {ThemeComponent}
 */
export default class Sorting extends ThemeComponent {
    init() {
        this._select = this.el.querySelector('select')
        this._onChange = this._onChange.bind(this)

        if (this._select) {
            this.scope.on(this._select, 'change', this._onChange)
        }
        this.scope.add(connectControl(this))
    }

    getValues() {
        if (!this._select || !this._select.value) {
            return {}
        }

        return { order: this._select.value }
    }

    getParamKeys() {
        return ['order']
    }

    getLabels() {
        return []
    }

    reset() {}

    resetAll() {}

    setFromUrl(params) {
        if (!this._select || !params?.order) {
            return
        }

        this._select.value = params.order
    }

    _onChange() {
        apply({ order: this._select.value })
    }
}
