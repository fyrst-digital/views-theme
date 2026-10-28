import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class Backdrop extends ThemeComponent {
    static options = {
        componentName: null,
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    _onClick(event) {
        event.preventDefault()
        window.Shopware.callMethod(this.options.componentName, 'close')
    }
}
