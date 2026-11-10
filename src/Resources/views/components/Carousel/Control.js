import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Prev/next control — commands the nearest Carousel owner (never global
 * `callMethod`, so nested or sibling carousels stay independent).
 *
 * @extends {ShopwareComponent}
 */
export default class CarouselControl extends ShopwareComponent {
    static options = {
        carouselComponent: 'ViewsTheme:Carousel',
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
        const carousel = this._carousel()
        if (carousel && typeof carousel[method] === 'function') {
            carousel[method]()
        }
    }

    /**
     * @returns {import('../Carousel.js').default|null}
     */
    _carousel() {
        const name = this.options.carouselComponent
        const el = this.el.closest(`[data-component="${name}"]`)
        return getInstanceByElement(name, el)
    }
}
