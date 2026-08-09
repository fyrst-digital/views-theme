import { applyReview } from '@views-theme/modules/review/apply.js'

/**
 * Review language filter control (URL SoT key: language).
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewLanguage extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
    }

    init() {
        this._input = this.el.querySelector('input[type="checkbox"]')
        this._onChange = this._onChange.bind(this)
        this._input?.addEventListener('change', this._onChange)
    }

    destroy() {
        this._input?.removeEventListener('change', this._onChange)
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
        applyReview({}, { panelComponent: this.options.panelComponent })
    }
}
