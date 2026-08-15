/**
 * Review form region — write/edit submit via Panel.save after Form:Handler validates.
 * Guest Account:Login submits natively (not intercepted).
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewForm extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
        submitEvent: 'ViewsTheme:Form:Handler:Submit',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        window.Shopware.on(this.options.submitEvent, this._onSubmit)
    }

    destroy() {
        window.Shopware.off(this.options.submitEvent, this._onSubmit)
    }

    /**
     * @param {{ el?: Element, form?: HTMLFormElement }} payload
     */
    _onSubmit(payload) {
        const form = payload?.form || payload?.el
        if (!(form instanceof HTMLFormElement) || !this.el.contains(form)) {
            return
        }
        window.Shopware.callMethod(
            this.options.panelComponent,
            'save',
            new FormData(form),
        )
    }
}
