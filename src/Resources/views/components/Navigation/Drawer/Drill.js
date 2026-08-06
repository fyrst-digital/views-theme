/**
 * @extends {ShopwareComponent}
 */
export default class NavigationDrawerDrill extends ShopwareComponent {
    static options = {
        url: null,
        direction: 'forward',
        drillEvent: 'ViewsTheme:Navigation:Drawer:Menu:Drill',
        loadingAttr: 'aria-busy',
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
        event.stopPropagation()

        if (this.el.getAttribute(this.options.loadingAttr) === 'true') {
            return
        }

        const url = this.options.url || this.el.getAttribute('href')
        if (!url) {
            return
        }

        window.Shopware.emit(this.options.drillEvent, {
            url,
            source: this.el,
            direction: this.options.direction === 'back' ? 'back' : 'forward',
        })
    }
}
