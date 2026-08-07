import { applyReview } from '@views-theme/modules/review/apply.js'

/**
 * Review points filter control (URL SoT key: points).
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewMatrix extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this.el.addEventListener('change', this._onChange)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
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
        applyReview({}, { panelComponent: this.options.panelComponent })
    }
}
