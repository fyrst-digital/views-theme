import { shell } from '@views-theme/modules/shared/shell-registry.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Opens a Modal by its server-rendered `id` through the shell registry.
 *
 * @extends {ThemeComponent}
 */
export default class ModalOpen extends ThemeComponent {
    static options = {
        modalId: null,
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.scope.on(this.el, 'click', this._onClick)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        event.preventDefault()
        if (!this.options.modalId) {
            console.error('ModalOpen: modalId is missing')
            return
        }

        shell(this.options.modalId).api.get()?.open?.()
    }
}
