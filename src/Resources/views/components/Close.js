/**
 * Calls `close` on the component named in `targetComponentName` (Drawer, Modal, Search overlay, …).
 *
 * @extends {ShopwareComponent}
 */
export default class Close extends ShopwareComponent {
    static options = {
        targetComponentName: null,
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        event.preventDefault()

        if (!this.options.targetComponentName) {
            return
        }

        window.Shopware.callMethod(this.options.targetComponentName, 'close')
    }
}
