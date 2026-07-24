export default class DrawerPanel extends ShopwareComponent {
    static options = {
        drawerComponentName: 'ViewsTheme:Drawer',
    }

    init() {
        this._onTransitionEnd = this._onTransitionEnd.bind(this)
        this.el.addEventListener('transitionend', this._onTransitionEnd)
    }

    destroy() {
        this.el.removeEventListener('transitionend', this._onTransitionEnd)
    }

    _onTransitionEnd(event) {
        if (event.target !== this.el || event.propertyName !== 'transform') {
            return
        }

        window.Shopware.callMethod(this.options.drawerComponentName, 'onPanelTransitionEnd')
    }
}
