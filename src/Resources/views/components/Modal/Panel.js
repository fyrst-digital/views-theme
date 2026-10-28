import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class ModalPanel extends ThemeComponent {
    static options = {
        modalComponentName: 'ViewsTheme:Modal',
    }

    init() {
        this._onTransitionEnd = this._onTransitionEnd.bind(this)
        this.scope.on(this.el, 'transitionend', this._onTransitionEnd)
    }

    /**
     * @param {TransitionEvent} event
     */
    _onTransitionEnd(event) {
        if (event.target !== this.el) {
            return
        }

        if (event.propertyName !== 'opacity' && event.propertyName !== 'transform') {
            return
        }

        window.Shopware.callMethod(this.options.modalComponentName, 'onPanelTransitionEnd')
    }
}
