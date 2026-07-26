export default class DrawerBackdrop extends ShopwareComponent {
    static options = {
        drawerComponentName: 'ViewsTheme:Drawer',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    _onClick(event) {
        event.preventDefault()
        window.Shopware.callMethod(this.options.drawerComponentName, 'close')
    }
}
