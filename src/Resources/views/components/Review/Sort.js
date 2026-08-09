import { applyReview } from '@views-theme/modules/review/apply.js'

/**
 * Review sort control (URL SoT key: sort).
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewSort extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
    }

    init() {
        this._select = this.el.querySelector('select')
        this._onChange = this._onChange.bind(this)
        this._select?.addEventListener('change', this._onChange)
    }

    destroy() {
        this._select?.removeEventListener('change', this._onChange)
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
        applyReview(
            { sort: this._select.value },
            { panelComponent: this.options.panelComponent },
        )
    }
}
