/**
 * @extends {ShopwareComponent}
 */
export default class CartShippingCalculation extends ShopwareComponent {
    static options = {
        configureEvent: 'ViewsTheme:Cart:Configure',
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this._onSubmit = this._onSubmit.bind(this)

        this.el.addEventListener('change', this._onChange)
        this.el.addEventListener('submit', this._onSubmit)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
        this.el.removeEventListener('submit', this._onSubmit)
    }

    toggle() {
        const details = this.el.querySelector('details')
        if (!(details instanceof HTMLDetailsElement)) {
            return
        }

        details.open = !details.open

        if (!details.open) {
            return
        }

        const summary = details.querySelector('summary')
        if (summary instanceof HTMLElement) {
            summary.focus({ preventScroll: true })
        }
    }

    _onSubmit(event) {
        event.preventDefault()
        this._emitConfigure()
    }

    _onChange(event) {
        if (!(event.target instanceof HTMLSelectElement)) {
            return
        }

        this._emitConfigure()
    }

    _emitConfigure() {
        const formData = new FormData(this.el)

        window.Shopware.emit(this.options.configureEvent, {
            formData,
            source: this.el,
        })
    }
}
