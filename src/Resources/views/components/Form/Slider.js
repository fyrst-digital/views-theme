/**
 * @extends {ShopwareComponent}
 */
export default class FormSlider extends ShopwareComponent {
    static options = {
        mode: 'single',
        min: 0,
        max: 100,
        step: 1,
    }

    init() {
        this._onInput = this._onInput.bind(this)
        this._inputs = Array.from(this.el.querySelectorAll('input[type="range"][data-slider]'))
        this._inputs.forEach((input) => {
            input.addEventListener('input', this._onInput)
            input.addEventListener('change', this._onInput)
        })
        this._paint()
    }

    destroy() {
        this._inputs?.forEach((input) => {
            input.removeEventListener('input', this._onInput)
            input.removeEventListener('change', this._onInput)
        })
    }

    getValues() {
        if (this._isRange()) {
            return {
                start: this._num(this._minInput()?.value, this._boundMin()),
                end: this._num(this._maxInput()?.value, this._boundMax()),
            }
        }

        return {
            value: this._num(this._valueInput()?.value, this._boundMin()),
        }
    }

    setValues(values = {}, { silent = true } = {}) {
        if (this._isRange()) {
            const start = values.start !== undefined && values.start !== null && values.start !== ''
                ? this._num(values.start, this._boundMin())
                : this._boundMin()
            const end = values.end !== undefined && values.end !== null && values.end !== ''
                ? this._num(values.end, this._boundMax())
                : this._boundMax()
            const clamped = this._clampRange(start, end)
            const minInput = this._minInput()
            const maxInput = this._maxInput()
            if (minInput) {
                minInput.value = String(clamped.start)
            }
            if (maxInput) {
                maxInput.value = String(clamped.end)
            }
        } else {
            const next = values.value !== undefined && values.value !== null && values.value !== ''
                ? this._num(values.value, this._boundMin())
                : this._boundMin()
            const input = this._valueInput()
            if (input) {
                input.value = String(this._clamp(next))
            }
        }

        this._paint()

        if (!silent) {
            this._emit('input')
            this._emit('change')
        }
    }

    _onInput(event) {
        if (!(event.target instanceof HTMLInputElement)) {
            return
        }

        if (this._isRange()) {
            const minInput = this._minInput()
            const maxInput = this._maxInput()
            if (!minInput || !maxInput) {
                return
            }

            let start = this._num(minInput.value, this._boundMin())
            let end = this._num(maxInput.value, this._boundMax())
            const which = event.target.getAttribute('data-slider')

            if (which === 'min' && start > end) {
                start = end
                minInput.value = String(start)
            }
            if (which === 'max' && end < start) {
                end = start
                maxInput.value = String(end)
            }

            this._syncThumbStack(start, end)
        }

        this._paint()
        this._emit(event.type === 'change' ? 'change' : 'input')
    }

    _paint() {
        const min = this._boundMin()
        const max = this._boundMax()
        const span = max - min

        if (this._isRange()) {
            const start = this._num(this._minInput()?.value, min)
            const end = this._num(this._maxInput()?.value, max)
            const startPct = span > 0 ? ((start - min) / span) * 100 : 0
            const endPct = span > 0 ? ((end - min) / span) * 100 : 100
            this.el.style.setProperty('--vi-fill-start', `${startPct}%`)
            this.el.style.setProperty('--vi-fill-end', `${endPct}%`)
            this._syncThumbStack(start, end)
            return
        }

        const value = this._num(this._valueInput()?.value, min)
        const pct = span > 0 ? ((value - min) / span) * 100 : 0
        this.el.style.setProperty('--vi-fill-start', '0%')
        this.el.style.setProperty('--vi-fill-end', `${pct}%`)
    }

    _syncThumbStack(start, end) {
        const minInput = this._minInput()
        const maxInput = this._maxInput()
        if (!minInput || !maxInput) {
            return
        }

        // When thumbs overlap, raise the one last moved via z-index is CSS default;
        // if equal, keep max on top so either can be dragged from the right.
        if (start >= end) {
            minInput.style.zIndex = '3'
            maxInput.style.zIndex = '4'
        } else {
            minInput.style.zIndex = ''
            maxInput.style.zIndex = ''
        }
    }

    _emit(type) {
        this.el.dispatchEvent(new Event(type, { bubbles: true }))
    }

    _isRange() {
        return (this.options.mode || 'single') === 'range'
    }

    _boundMin() {
        const min = this._num(this.options.min, 0)
        const fromDom = this._num(this._minInput()?.min ?? this._valueInput()?.min, min)
        return Number.isFinite(fromDom) ? fromDom : min
    }

    _boundMax() {
        const max = this._num(this.options.max, 100)
        const fromDom = this._num(this._maxInput()?.max ?? this._valueInput()?.max, max)
        return Number.isFinite(fromDom) ? fromDom : max
    }

    _clamp(value) {
        return Math.min(this._boundMax(), Math.max(this._boundMin(), value))
    }

    _clampRange(start, end) {
        let nextStart = this._clamp(start)
        let nextEnd = this._clamp(end)
        if (nextStart > nextEnd) {
            nextStart = nextEnd
        }
        return { start: nextStart, end: nextEnd }
    }

    _num(value, fallback = 0) {
        const n = typeof value === 'number' ? value : parseFloat(value)
        return Number.isFinite(n) ? n : fallback
    }

    _minInput() {
        return this.el.querySelector('input[type="range"][data-slider="min"]')
    }

    _maxInput() {
        return this.el.querySelector('input[type="range"][data-slider="max"]')
    }

    _valueInput() {
        return this.el.querySelector('input[type="range"][data-slider="value"]')
    }
}
