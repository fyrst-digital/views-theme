import { apply } from '@views-theme/modules/configurator/store.js'

/**
 * Dispatches a radio change into the configurator store.
 *
 * @extends {ShopwareComponent}
 */
export default class ProductConfiguratorOption extends ShopwareComponent {
    static options = {
        configuratorId: null,
        groupId: null,
        optionId: null,
        focusId: null,
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this.el.addEventListener('change', this._onChange)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
    }

    /**
     * @param {Event} event
     */
    _onChange(event) {
        const field = event.target
        if (!(field instanceof HTMLInputElement) || field.type !== 'radio' || !field.checked) {
            return
        }

        apply(this.options.configuratorId, {
            groupId: this.options.groupId,
            optionId: this.options.optionId,
            focusId: this.options.focusId,
        })
    }
}
