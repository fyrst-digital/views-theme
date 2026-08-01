export default class FilterAction extends ShopwareComponent {
    static options = {
        drawerComponent: 'ViewsTheme:Drawer',
        drawerId: 'vi-filter-drawer',
        shellComponent: 'ViewsTheme:Filter:Shell',
        panelComponent: 'ViewsTheme:Filter:Panel',
        hostComponent: 'ViewsTheme:Filter:Host',
        slotComponent: 'ViewsTheme:Filter:DrawerSlot',
        listingComponent: 'ViewsTheme:Product:Listing',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
    }

    init() {
        this._drawerEl = null
        this._onClick = this._onClick.bind(this)
        this._onDrawerOpen = this._onDrawerOpen.bind(this)
        this._onDrawerClose = this._onDrawerClose.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.on(this.options.closeEvent, this._onDrawerClose)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.off(this.options.closeEvent, this._onDrawerClose)
        this._returnPanelToHost()
    }

    open() {
        const drawer = this._getDrawerInstance()
        if (!drawer) {
            console.error('FilterAction: Drawer instance missing')
            return
        }

        if (typeof drawer.isOpen === 'function' && drawer.isOpen()) {
            return
        }

        this._movePanelToDrawer()
        drawer.open()
    }

    close() {
        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.close === 'function') {
            drawer.close()
        }
    }

    _onClick(event) {
        event.preventDefault()

        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.isOpen === 'function' && drawer.isOpen()) {
            drawer.close()
            return
        }

        this.open()
    }

    _onDrawerOpen(payload) {
        const el = this._eventEl(payload)
        if (!this._isOwnDrawer(el)) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
        this._refreshListingControls()
    }

    _onDrawerClose(payload) {
        const el = this._eventEl(payload)
        if (!this._isOwnDrawer(el)) {
            return
        }

        this._returnPanelToHost()
        this._refreshListingControls()
        this.el.setAttribute('aria-expanded', 'false')
        this.el.focus()
    }

    _shell() {
        return this.el.closest(`[data-component="${this.options.shellComponent}"]`) || document
    }

    _queryInShell(componentName) {
        const root = this._shell()
        return root.querySelector(`[data-component="${componentName}"]`)
    }

    _movePanelToDrawer() {
        const panel = this._queryInShell(this.options.panelComponent)
        const slot = this._queryInShell(this.options.slotComponent)
        if (!panel || !slot) {
            console.error('FilterAction: panel or drawer slot missing')
            return
        }

        if (!slot.contains(panel)) {
            slot.appendChild(panel)
        }
    }

    _returnPanelToHost() {
        const panel = this._queryInShell(this.options.panelComponent)
            || document.querySelector(`[data-component="${this.options.panelComponent}"]`)
        const host = this._queryInShell(this.options.hostComponent)
            || document.querySelector(`[data-component="${this.options.hostComponent}"]`)
        if (!panel || !host) {
            return
        }

        if (!host.contains(panel)) {
            host.appendChild(panel)
        }
    }

    _refreshListingControls() {
        const listingEl = document.querySelector(
            `[data-component="${this.options.listingComponent}"]`,
        )
        if (!listingEl || !window.Shopware?.getComponentInstanceByElement) {
            return
        }

        const listing = window.Shopware.getComponentInstanceByElement(
            this.options.listingComponent,
            listingEl,
        )
        if (listing && typeof listing.refreshControls === 'function') {
            listing.refreshControls()
        }
    }

    _getDrawerInstance() {
        if (!this._drawerEl || !document.body.contains(this._drawerEl)) {
            const root = this._shell()
            this._drawerEl = root.querySelector(
                `[data-component="${this.options.drawerComponent}"][id="${this.options.drawerId}"]`,
            ) || root.querySelector(`[data-component="${this.options.drawerComponent}"]`)
        }

        if (!this._drawerEl || !window.Shopware?.getComponentInstanceByElement) {
            return null
        }

        return window.Shopware.getComponentInstanceByElement(
            this.options.drawerComponent,
            this._drawerEl,
        )
    }

    _eventEl(payload) {
        if (payload && typeof payload === 'object' && 'el' in payload) {
            return payload.el
        }

        return payload instanceof Element ? payload : null
    }

    _isOwnDrawer(el) {
        if (!el) {
            return false
        }

        const drawer = this._getDrawerInstance()?.el || this._drawerEl
        return drawer === el
    }
}
