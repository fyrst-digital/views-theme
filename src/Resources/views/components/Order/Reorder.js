/**
 * Repeat order — submit → `Cart:Add` (the Cart owner posts the form data and opens the drawer).
 * Replaces the native POST that redirected to the core offcanvas route.
 *
 * @extends {ShopwareComponent}
 */
export default class OrderReorder extends ShopwareComponent {
    static options = {
        addEvent: 'ViewsTheme:Cart:Add',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this.el.addEventListener('submit', this._onSubmit)
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
    }

    /**
     * @param {SubmitEvent} event
     */
    _onSubmit(event) {
        event.preventDefault()

        window.Shopware.emit(this.options.addEvent, {
            formData: new FormData(this.el),
            source: this.el,
        })

        this.el.closest('[popover]')?.hidePopover()
    }
}
