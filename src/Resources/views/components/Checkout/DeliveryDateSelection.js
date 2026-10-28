import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class CheckoutDeliveryDateSelection extends ThemeComponent {
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
    this.scope.on(this._input, 'change', this._onChange)
    this._clampValue()
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
