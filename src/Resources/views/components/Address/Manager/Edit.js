import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * @extends {ShopwareComponent}
 */
export default class AddressManagerEdit extends ShopwareComponent {
    static options = {
        addressId: null,
        type: 'shipping',
        managerComponent: 'ViewsTheme:Address:Manager',
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
        const root = this.el.closest(`[data-component="${this.options.managerComponent}"]`)
        getInstanceByElement(this.options.managerComponent, root)?.openEdit?.(
            this.options.addressId,
            this.options.type,
        )
    }
}
