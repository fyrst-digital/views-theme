var e=class extends ShopwareComponent {
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
        formData.set('redirectTo', '')

        window.Shopware.emit(this.options.configureEvent, {
            formData,
            source: this.el,
        })
    }
}
export{e as default};
