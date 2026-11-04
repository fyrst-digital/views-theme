import {
    getInstanceByElement,
    mountTemplate,
    unmountEl,
    mountComponents,
} from '@views-theme/modules/lazy-shell.js'

/**
 * @extends {ShopwareComponent}
 */
export default class CartDrawerAction extends ShopwareComponent {
    static options = {
        /** `<template>` with the data-free drawer shell (rendered next to the Action) */
        templateId: 'vi-cart-drawer-template',
        drawerComponentName: 'ViewsTheme:Drawer',
        drawerSelector: '#vi-cart-drawer',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
        changedEvent: 'ViewsTheme:Cart:Changed',
        /** Cart:Changed.action values that auto-open when ok (empty = never) */
        openOnActions: ['add'],
    }

    init() {
        this._drawerEl = null
        this._loading = false
        this._onClick = this._onClick.bind(this)
        this._onDrawerOpen = this._onDrawerOpen.bind(this)
        this._onDrawerClose = this._onDrawerClose.bind(this)
        this._onCartChanged = this._onCartChanged.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.on(this.options.closeEvent, this._onDrawerClose)
        window.Shopware.on(this.options.changedEvent, this._onCartChanged)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.openEvent, this._onDrawerOpen)
        window.Shopware.off(this.options.closeEvent, this._onDrawerClose)
        window.Shopware.off(this.options.changedEvent, this._onCartChanged)
        this._unmountDrawer()
    }

    /**
     * Public API — header click, callMethod, and openOnActions auto-open.
     * No-op when already open (Body refreshes on Cart:Changed).
     */
    async open() {
        if (this._loading) {
            return
        }

        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.isOpen === 'function' && drawer.isOpen()) {
            return
        }

        await this._mountAndOpenDrawer()
    }

    async close() {
        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.close === 'function') {
            drawer.close()
        }
    }

    async _onClick(event) {
        event.preventDefault()

        if (this._loading) {
            return
        }

        const drawer = this._getDrawerInstance()
        if (drawer && typeof drawer.isOpen === 'function' && drawer.isOpen()) {
            drawer.close()
            return
        }

        await this.open()
    }

    _onCartChanged(payload) {
        if (!payload?.ok) {
            return
        }

        const actions = Array.isArray(this.options.openOnActions)
            ? this.options.openOnActions
            : []

        if (!actions.includes(payload.action)) {
            return
        }

        void this.open()
    }

    /**
     * Opens the shell straight away: no request before the drawer shows.
     * `Cart:Drawer:Body` renders the loader and fetches the cart itself.
     */
    async _mountAndOpenDrawer() {
        this._loading = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            this._drawerEl = mountTemplate(this.options.templateId, this.options.drawerSelector)
            await mountComponents(this._drawerEl)

            const drawer = this._getDrawerInstance()
            if (!drawer || typeof drawer.open !== 'function') {
                console.error('CartDrawerAction: Drawer component did not mount')
                return
            }

            drawer.open()
        } catch (error) {
            console.error('CartDrawerAction: Failed to open cart drawer', error)
        } finally {
            this._loading = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _getDrawerInstance() {
        if (!this._drawerEl || !document.body.contains(this._drawerEl)) {
            this._drawerEl = document.querySelector(this.options.drawerSelector)
        }

        return getInstanceByElement(this.options.drawerComponentName, this._drawerEl)
    }

    _onDrawerOpen(drawerEl) {
        if (drawerEl && this._drawerEl && drawerEl !== this._drawerEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'true')
    }

    _onDrawerClose(drawerEl) {
        if (drawerEl && this._drawerEl && drawerEl !== this._drawerEl) {
            return
        }

        this.el.setAttribute('aria-expanded', 'false')
        this._unmountDrawer()
    }

    _unmountDrawer() {
        unmountEl(this._drawerEl, this.options.drawerSelector)
        this._drawerEl = null
    }
}
