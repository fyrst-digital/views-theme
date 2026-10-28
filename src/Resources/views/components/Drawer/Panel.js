import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class DrawerPanel extends ThemeComponent {
    static options = {
        drawerComponentName: 'ViewsTheme:Drawer',
    }

    init() {
        this._onTransitionEnd = this._onTransitionEnd.bind(this)
        this.scope.on(this.el, 'transitionend', this._onTransitionEnd)
    }

    _onTransitionEnd(event) {
        if (event.target !== this.el || event.propertyName !== 'transform') {
            return
        }

        window.Shopware.callMethod(this.options.drawerComponentName, 'onPanelTransitionEnd')
    }
}
