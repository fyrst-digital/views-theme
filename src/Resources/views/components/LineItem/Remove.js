import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class LineItemRemove extends ThemeComponent {
    static options = {
        lineItemId: null,
        removeEvent: 'ViewsTheme:Cart:Remove',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this.scope.on(this.el, 'submit', this._onSubmit)
    }

    _onSubmit(event) {
        event.preventDefault()

        if (!this.options.lineItemId) {
            return
        }

        window.Shopware.emit(this.options.removeEvent, {
            lineItemId: this.options.lineItemId,
            source: this.el,
        })
    }
}
