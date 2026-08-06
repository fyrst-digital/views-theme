import { applyListing } from '@views-theme/modules/listing/apply.js'
import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * @extends {ShopwareComponent}
 */
export default class FilterRange extends ShopwareComponent {
    static options = {
        minKey: 'min-price',
        maxKey: 'max-price',
        min: 0,
        max: 100,
        step: 1,
        unit: '',
        listingComponent: 'ViewsTheme:Product:Listing',
        groupComponent: 'ViewsTheme:Filter:Group',
        sliderComponent: 'ViewsTheme:Form:Slider',
        debounce: 500,
    }

    init() {
        this._min = this.el.querySelector('input[data-range="min"]')
        this._max = this.el.querySelector('input[data-range="max"]')
        this._timer = null
        this._syncing = false
        this._onFieldInput = this._onFieldInput.bind(this)
        this._onSliderInput = this._onSliderInput.bind(this)
        this._onSliderChange = this._onSliderChange.bind(this)
        this._onClick = this._onClick.bind(this)
        this._min?.addEventListener('input', this._onFieldInput)
        this._max?.addEventListener('input', this._onFieldInput)
        this.el.addEventListener('input', this._onSliderInput)
        this.el.addEventListener('change', this._onSliderChange)
        this.el.addEventListener('click', this._onClick)
        this._syncSliderFromFields({ silent: true })
    }

    destroy() {
        this._min?.removeEventListener('input', this._onFieldInput)
        this._max?.removeEventListener('input', this._onFieldInput)
        this.el.removeEventListener('input', this._onSliderInput)
        this.el.removeEventListener('change', this._onSliderChange)
        this.el.removeEventListener('click', this._onClick)
        if (this._timer) {
            window.clearTimeout(this._timer)
        }
    }

    getValues() {
        const values = {}
        if (this._min?.value) {
            values[this.options.minKey] = this._min.value
        }
        if (this._max?.value) {
            values[this.options.maxKey] = this._max.value
        }
        return values
    }

    getParamKeys() {
        return [this.options.minKey, this.options.maxKey].filter(Boolean)
    }

    getLabels() {
        const labels = []
        const unit = this.options.unit ? ` ${this.options.unit}` : ''
        if (this._min?.value) {
            labels.push({ id: this.options.minKey, label: `${this._min.value}${unit}` })
        }
        if (this._max?.value) {
            labels.push({ id: this.options.maxKey, label: `${this._max.value}${unit}` })
        }
        return labels
    }

    reset(id) {
        if (id === this.options.minKey && this._min) {
            this._min.value = ''
        }
        if (id === this.options.maxKey && this._max) {
            this._max.value = ''
        }
        this._syncSliderFromFields({ silent: true })
    }

    resetAll() {
        if (this._min) {
            this._min.value = ''
        }
        if (this._max) {
            this._max.value = ''
        }
        this._syncSliderFromFields({ silent: true })
    }

    setFromUrl(params) {
        if (this._min) {
            this._min.value = params?.[this.options.minKey] || ''
        }
        if (this._max) {
            this._max.value = params?.[this.options.maxKey] || ''
        }
        this._syncSliderFromFields({ silent: true })
    }

    _onClick(event) {
        const reset = event.target instanceof Element
            ? event.target.closest('[data-filter-reset]')
            : null
        if (!reset || !this.el.contains(reset)) {
            return
        }

        event.preventDefault()
        this.resetAll()
        this._closeGroup()
        applyListing({}, { listingComponent: this.options.listingComponent })
    }

    _onFieldInput() {
        this._clampFields()
        this._syncSliderFromFields({ silent: true })
        this._scheduleApply()
    }

    _onSliderInput(event) {
        if (!this._isSliderEvent(event) || this._syncing) {
            return
        }

        // Live field preview only — never apply while dragging
        this._syncFieldsFromSlider()
    }

    _onSliderChange(event) {
        if (!this._isSliderEvent(event) || this._syncing) {
            return
        }

        // Commit on thumb release only
        this._syncFieldsFromSlider()
        this._applyNow()
    }

    _isSliderEvent(event) {
        const sliderEl = this._sliderEl()
        return !!(sliderEl && event.target instanceof Node && sliderEl.contains(event.target))
    }

    _scheduleApply() {
        if (this._timer) {
            window.clearTimeout(this._timer)
        }
        this._timer = window.setTimeout(() => {
            this._applyNow()
        }, this.options.debounce || 500)
    }

    _applyNow() {
        if (this._timer) {
            window.clearTimeout(this._timer)
            this._timer = null
        }
        this._closeGroup()
        applyListing({}, { listingComponent: this.options.listingComponent })
    }

    _syncSliderFromFields({ silent = true } = {}) {
        const slider = this._slider()
        if (!slider?.setValues) {
            return
        }

        const start = this._fieldValue(this._min)
        const end = this._fieldValue(this._max)
        this._syncing = true
        slider.setValues({
            start: start !== null ? start : this._boundMin(),
            end: end !== null ? end : this._boundMax(),
        }, { silent })
        this._syncing = false
    }

    _syncFieldsFromSlider() {
        const slider = this._slider()
        if (!slider?.getValues) {
            return
        }

        const { start, end } = slider.getValues()
        this._syncing = true
        if (this._min) {
            this._min.value = start === this._boundMin() ? '' : String(start)
        }
        if (this._max) {
            this._max.value = end === this._boundMax() ? '' : String(end)
        }
        this._syncing = false
    }

    _clampFields() {
        const min = this._fieldValue(this._min)
        const max = this._fieldValue(this._max)
        if (min === null || max === null) {
            return
        }
        if (min > max && this._min && this._max) {
            // Keep the field that was just edited within the other
            if (document.activeElement === this._min) {
                this._min.value = String(max)
            } else if (document.activeElement === this._max) {
                this._max.value = String(min)
            }
        }
    }

    _fieldValue(input) {
        if (!input?.value) {
            return null
        }
        const n = parseFloat(input.value)
        return Number.isFinite(n) ? n : null
    }

    _boundMin() {
        const n = parseFloat(this.options.min)
        return Number.isFinite(n) ? n : 0
    }

    _boundMax() {
        const n = parseFloat(this.options.max)
        return Number.isFinite(n) ? n : 100
    }

    _sliderEl() {
        const name = this.options.sliderComponent || 'ViewsTheme:Form:Slider'
        return this.el.querySelector(`[data-component="${name}"]`)
    }

    _slider() {
        const name = this.options.sliderComponent || 'ViewsTheme:Form:Slider'
        return getInstanceByElement(name, this._sliderEl())
    }

    _group() {
        const name = this.options.groupComponent || 'ViewsTheme:Filter:Group'
        const el = this.el.querySelector(`[data-component="${name}"]`)
        return getInstanceByElement(name, el)
    }

    _closeGroup() {
        this._group()?.close?.()
    }
}
