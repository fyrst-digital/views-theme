import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Selectable address card. `data-variant` is `current` (hero) or `available` (row).
 *
 * @extends {ShopwareComponent}
 */
export default class AddressManagerItem extends ShopwareComponent {
    static options = {
        addressId: null,
        type: 'shipping',
        disabled: false,
        managerComponent: 'ViewsTheme:Address:Manager',
        editComponent: 'ViewsTheme:Address:Manager:Edit',
        defaultComponent: 'ViewsTheme:Address:Manager:Default',
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
        const action = event.target.closest(
            `[data-component="${this.options.editComponent}"], [data-component="${this.options.defaultComponent}"]`,
        )
        if (action && this.el.contains(action)) {
            event.preventDefault()
            return
        }

        if (this.options.disabled) {
            return
        }

        this._manager()?.select?.(this.options.addressId, this.options.type)
    }

    _manager() {
        const root = this.el.closest(`[data-component="${this.options.managerComponent}"]`)
        return getInstanceByElement(this.options.managerComponent, root)
    }
}
