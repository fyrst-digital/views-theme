/**
 * Prev/next control — commands Gallery owner via callMethod.
 *
 * @extends {ShopwareComponent}
 */
export default class GalleryControl extends ShopwareComponent {
    static options = {
        galleryComponent: 'ViewsTheme:Gallery',
        direction: 'next',
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
        if (this.el.disabled) {
            return
        }

        const method = this.options.direction === 'prev' ? 'prev' : 'next'
        window.Shopware.callMethod(this.options.galleryComponent, method)
    }
}
