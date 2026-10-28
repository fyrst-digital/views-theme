import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class CartPromotionForm extends ThemeComponent {
    static options = {
        promoteEvent: 'ViewsTheme:Cart:Promote',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this.scope.on(this.el, 'submit', this._onSubmit)
    }

    _onSubmit(event) {
        event.preventDefault()

        const formData = new FormData(this.el)

        window.Shopware.emit(this.options.promoteEvent, {
            code: formData.get('code'),
            formData,
            source: this.el,
        })
    }
}
