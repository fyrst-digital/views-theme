export default class LineItemElementQuantity extends ShopwareComponent {
    static options = {
        lineItemId: null,
        updateEvent: 'ViewsTheme:Cart:Update',
        delay: 800,
    }

    init() {
        this._timer = null
        this._onChange = this._onChange.bind(this)
        this._onSubmit = this._onSubmit.bind(this)

        this.el.addEventListener('change', this._onChange)
        this.el.addEventListener('input', this._onChange)
        this.el.addEventListener('submit', this._onSubmit)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
        this.el.removeEventListener('input', this._onChange)
        this.el.removeEventListener('submit', this._onSubmit)
        this._clearTimer()
    }

    _onSubmit(event) {
        event.preventDefault()
        this._emitUpdate()
    }

    _onChange() {
        this._clearTimer()
        this._timer = window.setTimeout(() => {
            this._emitUpdate()
        }, this.options.delay)
    }

    _emitUpdate() {
        const input = this.el.querySelector('input[type="number"]')
        if (!input || !this.options.lineItemId) {
            return
        }

        const quantity = Number.parseInt(input.value, 10)
        if (Number.isNaN(quantity)) {
            return
        }

        window.Shopware.emit(this.options.updateEvent, {
            lineItemId: this.options.lineItemId,
            quantity,
            source: this.el,
        })
    }

    _clearTimer() {
        if (this._timer) {
            window.clearTimeout(this._timer)
            this._timer = null
        }
    }
}
