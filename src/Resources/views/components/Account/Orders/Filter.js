/**
 * Order history filter — any select change submits the GET form (page resets because the form
 * carries no `p`). Same full-navigation model as the Pagination hrefs on this page.
 *
 * @extends {ShopwareComponent}
 */
export default class AccountOrdersFilter extends ShopwareComponent {
    init() {
        this._onChange = this._onChange.bind(this)
        this.el.addEventListener('change', this._onChange)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
    }

    _onChange() {
        this.el.requestSubmit()
    }
}
