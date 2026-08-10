/**
 * @extends {ShopwareComponent}
 */
export default class GalleryFullscreenClose extends ShopwareComponent {
    static options = {
        overlayComponentName: 'ViewsTheme:Gallery:Fullscreen',
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
        window.Shopware.callMethod(this.options.overlayComponentName, 'close')
    }
}
