import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

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
        handlerComponent: 'ViewsTheme:Form:Handler',
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

        const handler = getInstanceByElement(this.options.handlerComponent, form)
        const panelEl = this.el.closest(`[data-component="${this.options.panelComponent}"]`)
        const panel = getInstanceByElement(this.options.panelComponent, panelEl)
        if (!panel || typeof panel.save !== 'function') {
            handler?.setSubmitting(false)
            return
        }

        Promise.resolve(panel.save(new FormData(form)))
            .catch(() => {})
            .finally(() => {
                if (handler?.el && document.contains(handler.el)) {
                    handler.setSubmitting(false)
                }
            })
    }
}
