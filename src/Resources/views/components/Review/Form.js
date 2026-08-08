/**
 * Review form region — login cancel + create/edit submit via Panel.save.
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewForm extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('submit', this._onSubmit)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
        this.el.removeEventListener('click', this._onClick)
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
        event.preventDefault()
        window.Shopware.callMethod(
            this.options.panelComponent,
            'save',
            new FormData(form),
        )
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        const target = event.target instanceof Element
            ? event.target.closest('[data-review-form-action="cancel"]')
            : null
        if (!target || !this.el.contains(target)) {
            return
        }
        event.preventDefault()
        window.Shopware.callMethod(this.options.panelComponent, 'closeForm')
    }
}
