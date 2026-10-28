import { applyReview, connectReviewControl } from '@views-theme/modules/review/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Review points filter control (URL SoT key: points).
 *
 * @extends {ThemeComponent}
 */
export default class ReviewMatrix extends ThemeComponent {
    static options = {}

    init() {
        this._onChange = this._onChange.bind(this)
        this.scope.on(this.el, 'change', this._onChange)
        this.scope.add(connectReviewControl(this))
    }

    getValues() {
        const values = [...this.el.querySelectorAll('input[type="checkbox"][name="points"]:checked')]
            .map((input) => input.value)
            .filter(Boolean)

        return values.length ? { points: values } : {}
    }

    getParamKeys() {
        return ['points']
    }

    getLabels() {
        return []
    }

    /**
     * @param {Record<string, string|string[]>} params
     */
    setFromUrl(params) {
        let selected = params?.points
        if (typeof selected === 'string') {
            selected = selected.includes('|') ? selected.split('|') : [selected]
        }
        if (!Array.isArray(selected)) {
            selected = []
        }
        const set = new Set(selected.map(String))

        this.el.querySelectorAll('input[type="checkbox"][name="points"]').forEach((input) => {
            input.checked = set.has(input.value)
        })
    }

    _onChange() {
        applyReview()
    }
}
