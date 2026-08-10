import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Prev/next control — commands nearest Gallery owner.
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
        const gallery = this._gallery()
        if (gallery && typeof gallery[method] === 'function') {
            gallery[method]()
        }
    }

    /**
     * @returns {import('../Gallery.js').default|null}
     */
    _gallery() {
        const name = this.options.galleryComponent
        const el = this.el.closest(`[data-component="${name}"]`)
        return getInstanceByElement(name, el)
    }
}
