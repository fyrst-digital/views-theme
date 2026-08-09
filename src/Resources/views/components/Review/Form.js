/**
 * Review form region — write/edit submit via Panel.save.
 * Guest Account:Login submits natively (not intercepted).
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewForm extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
        saveFormSelector: '[data-review-form="save"]',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this.el.addEventListener('submit', this._onSubmit)
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
    }

    /**
     * @param {SubmitEvent} event
     */
    _onSubmit(event) {
        const form = event.target instanceof HTMLFormElement
            ? event.target
            : null
        if (!form || !this.el.contains(form)) {
            return
        }
        if (!form.matches(this.options.saveFormSelector)) {
            return
        }
        event.preventDefault()
        window.Shopware.callMethod(
            this.options.panelComponent,
            'save',
            new FormData(form),
        )
    }
}
