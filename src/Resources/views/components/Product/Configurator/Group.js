import { apply } from '@views-theme/modules/configurator/store.js'

/**
 * Dispatches a select or radio change into the configurator store.
 *
 * @extends {ShopwareComponent}
 */
export default class ProductConfiguratorGroup extends ShopwareComponent {
    static options = {
        configuratorId: null,
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
        const field = this._field(event.target)
        if (!field) {
            return
        }

        apply(this.options.configuratorId, {
            groupId: field.name,
            optionId: field.value,
            focusId: field.id || null,
        })
    }

    /**
     * @param {EventTarget|null} target
     * @returns {HTMLSelectElement|HTMLInputElement|null}
     */
    _field(target) {
        if (target instanceof HTMLSelectElement) {
            return target.value === '' ? null : target
        }

        if (target instanceof HTMLInputElement && target.type === 'radio' && target.checked && target.value !== '') {
            return target
        }

        return null
    }
}
