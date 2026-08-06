/**
 * @extends {ShopwareComponent}
 */
export default class CheckoutDeliveryDateSelection extends ShopwareComponent {
  static options = {
    inputSelector: 'input[type="date"]',
  }

  init() {
    this._onChange = this._clampValue.bind(this)
    this._input = this.el.querySelector(this.options.inputSelector)
    if (!this._input) {
      return
    }
    this._min = this._input.getAttribute('min')
    this._max = this._input.getAttribute('max')
    this._input.addEventListener('change', this._onChange)
    this._clampValue()
  }

  destroy() {
    if (this._input && this._onChange) {
      this._input.removeEventListener('change', this._onChange)
    }
  }

  _clampValue() {
    if (!this._input) {
      return
    }
    const value = this._input.value
    if (!value) {
      return
    }
    if (this._min && value < this._min) {
      this._input.value = this._min
    } else if (this._max && value > this._max) {
      this._input.value = this._max
    }
  }
}
