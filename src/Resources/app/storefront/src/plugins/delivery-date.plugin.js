import Plugin from 'src/plugin-system/plugin.class';

export default class DeliveryDatePlugin extends Plugin {
    static options = {
        inputSelector: '[data-component="delivery-date-selection"] input[type="date"]',
    };

    init() {
        this._input = this.el.querySelector(this.options.inputSelector);
        if (!this._input) {
            return;
        }
        this._min = this._input.getAttribute('min');
        this._max = this._input.getAttribute('max');
        this._registerEvents();
        this._clampValue();
    }

    _registerEvents() {
        this._input.addEventListener('change', this._clampValue.bind(this));
    }

    _clampValue() {
        const value = this._input.value;
        if (!value) {
            return;
        }
        if (this._min && value < this._min) {
            this._input.value = this._min;
        } else if (this._max && value > this._max) {
            this._input.value = this._max;
        }
    }
}