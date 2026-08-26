import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Opens a Modal by id (or the closest Modal) via instance lookup.
 *
 * @extends {ShopwareComponent}
 */
export default class ModalOpen extends ShopwareComponent {
    static options = {
        modalComponentName: 'ViewsTheme:Modal',
        modalId: null,
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
        const modalEl = this._modalEl()
        if (!modalEl) {
            return
        }

        getInstanceByElement(this.options.modalComponentName, modalEl)?.open()
    }

    /**
     * @returns {Element|null}
     */
    _modalEl() {
        const id = this.options.modalId
        if (id) {
            return document.getElementById(id)
        }

        return (
            this.el.closest(`[data-component="${this.options.modalComponentName}"]`)
            || document.querySelector(`[data-component="${this.options.modalComponentName}"]`)
        )
    }
}
