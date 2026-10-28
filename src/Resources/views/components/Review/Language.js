import { applyReview, connectReviewControl } from '@views-theme/modules/review/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Review language filter control (URL SoT key: language).
 *
 * @extends {ThemeComponent}
 */
export default class ReviewLanguage extends ThemeComponent {
    static options = {}

    init() {
        this._input = this.el.querySelector('input[type="checkbox"]')
        this._onChange = this._onChange.bind(this)
        this.scope.on(this._input, 'change', this._onChange)
        this.scope.add(connectReviewControl(this))
    }

    getValues() {
        if (!this._input?.checked) {
            return {}
        }
        return { language: this._input.value || 'filter-language' }
    }

    getParamKeys() {
        return ['language']
    }

    getLabels() {
        return []
    }

    /**
     * @param {Record<string, string|string[]>} params
     */
    setFromUrl(params) {
        if (!this._input) {
            return
        }
        const raw = params?.language
        const next = raw === 'filter-language' || raw === '1' || raw === true
        if (this._input.checked !== next) {
            this._input.checked = next
        }
    }

    _onChange() {
        applyReview()
    }
}
