/**
 * @extends {ShopwareComponent}
 */
export default class ModalPanel extends ShopwareComponent {
    static options = {
        modalComponentName: 'ViewsTheme:Modal',
    }

    init() {
        this._onTransitionEnd = this._onTransitionEnd.bind(this)
        this.el.addEventListener('transitionend', this._onTransitionEnd)
    }

    destroy() {
        this.el.removeEventListener('transitionend', this._onTransitionEnd)
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
