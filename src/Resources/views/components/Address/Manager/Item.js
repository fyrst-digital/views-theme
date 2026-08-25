import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Selectable address card — click selects (except dropdown).
 *
 * @extends {ShopwareComponent}
 */
export default class AddressManagerItem extends ShopwareComponent {
    static options = {
        addressId: null,
        type: 'shipping',
        disabled: false,
        managerComponent: 'ViewsTheme:Address:Manager',
        dropdownComponent: 'ViewsTheme:Dropdown',
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
        if (this.options.disabled) {
            return
        }

        const dropdown = event.target.closest(
            `[data-component="${this.options.dropdownComponent}"]`,
        )
        if (dropdown && this.el.contains(dropdown)) {
            return
        }

        this._manager()?.select?.(this.options.addressId, this.options.type)
    }

    _manager() {
        const root = this.el.closest(`[data-component="${this.options.managerComponent}"]`)
        return getInstanceByElement(this.options.managerComponent, root)
    }
}
