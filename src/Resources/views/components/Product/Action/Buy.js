import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class ProductActionBuy extends ThemeComponent {
    static options = {
        addEvent: 'ViewsTheme:Cart:Add',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this.scope.on(this.el, 'submit', this._onSubmit)
    }

    _onSubmit(event) {
        event.preventDefault()

        const formData = new FormData(this.el)

        window.Shopware.emit(this.options.addEvent, {
            formData,
            source: this.el,
        })
    }
}
