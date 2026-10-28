import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class DrawerClose extends ThemeComponent {
    static options = {
        drawerComponentName: 'ViewsTheme:Drawer',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    _onClick(event) {
        event.preventDefault()
        window.Shopware.callMethod(this.options.drawerComponentName, 'close')
    }
}
