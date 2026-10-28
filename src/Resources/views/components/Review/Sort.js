import { applyReview, connectReviewControl } from '@views-theme/modules/review/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Review sort control (URL SoT key: sort).
 *
 * @extends {ThemeComponent}
 */
export default class ReviewSort extends ThemeComponent {
    static options = {}

    init() {
        this._select = this.el.querySelector('select')
        this._onChange = this._onChange.bind(this)
        this.scope.on(this._select, 'change', this._onChange)
        this.scope.add(connectReviewControl(this))
    }

    getValues() {
        if (!this._select?.value) {
            return {}
        }
        return { sort: this._select.value }
    }

    getParamKeys() {
        return ['sort']
    }

    getLabels() {
        return []
    }

    /**
     * @param {Record<string, string|string[]>} params
     */
    setFromUrl(params) {
        if (!this._select || !params?.sort) {
            return
        }
        this._select.value = Array.isArray(params.sort) ? params.sort[0] : params.sort
    }

    _onChange() {
        applyReview({ sort: this._select.value })
    }
}
