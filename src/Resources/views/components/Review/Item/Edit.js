/**
 * Own-review edit control — opens Panel form mode.
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewItemEdit extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
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
        const target = event.target instanceof Element
            ? event.target.closest('button')
            : null
        if (!target || !this.el.contains(target)) {
            return
        }
        event.preventDefault()
        window.Shopware.callMethod(this.options.panelComponent, 'openForm')
    }
}
