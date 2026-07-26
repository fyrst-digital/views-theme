export default class QuantityInput extends ShopwareComponent {
    static options = {
        inputSelector: 'input[type="number"]',
    }

    init() {
        this._input = this.el.querySelector(this.options.inputSelector)
        if (!this._input) {
            return
        }

        const buttons = Array.from(this.el.querySelectorAll('button[type="button"]'))
        this._decrease = buttons[0] || null
        this._increase = buttons[1] || null

        this._onDecrease = this._onDecrease.bind(this)
        this._onIncrease = this._onIncrease.bind(this)
        this._onInput = this._onInput.bind(this)

        this._decrease?.addEventListener('click', this._onDecrease)
        this._increase?.addEventListener('click', this._onIncrease)
        this._input.addEventListener('change', this._onInput)
        this._syncButtonState()
    }

    destroy() {
        this._decrease?.removeEventListener('click', this._onDecrease)
        this._increase?.removeEventListener('click', this._onIncrease)
        this._input?.removeEventListener('change', this._onInput)
    }

    _step() {
        const step = parseFloat(this._input.step)
        return Number.isFinite(step) && step > 0 ? step : 1
    }

    _min() {
        const min = parseFloat(this._input.min)
        return Number.isFinite(min) ? min : 0
    }

    _max() {
        const max = parseFloat(this._input.max)
        return Number.isFinite(max) ? max : Number.POSITIVE_INFINITY
    }

    _value() {
        const value = parseFloat(this._input.value)
        return Number.isFinite(value) ? value : this._min()
    }

    _setValue(next) {
        const clamped = Math.min(this._max(), Math.max(this._min(), next))
        this._input.value = String(clamped)
        this._input.dispatchEvent(new Event('input', { bubbles: true }))
        this._input.dispatchEvent(new Event('change', { bubbles: true }))
        this._syncButtonState()
    }

    _onDecrease(event) {
        event.preventDefault()
        this._setValue(this._value() - this._step())
    }

    _onIncrease(event) {
        event.preventDefault()
        this._setValue(this._value() + this._step())
    }

    _onInput() {
        this._syncButtonState()
    }

    _syncButtonState() {
        if (this._input.disabled) {
            if (this._decrease) {
                this._decrease.disabled = true
            }
            if (this._increase) {
                this._increase.disabled = true
            }
            return
        }

        const value = this._value()
        if (this._decrease) {
            this._decrease.disabled = value <= this._min()
        }
        if (this._increase) {
            this._increase.disabled = value >= this._max()
        }
    }
}
