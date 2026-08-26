/**
 * Toggles footer column content on small viewports via aria-expanded.
 *
 * @extends {ShopwareComponent}
 */
export default class FooterColumn extends ShopwareComponent {
    init() {
        this._toggle = this.el.querySelector('button[aria-expanded]')
        if (!this._toggle) {
            return
        }

        this._onClick = this._handleClick.bind(this)
        this._toggle.addEventListener('click', this._onClick)
    }

    destroy() {
        this._toggle?.removeEventListener('click', this._onClick)
        this._toggle = null
        this._onClick = null
    }

    _handleClick() {
        const expanded = this._toggle.getAttribute('aria-expanded') === 'true'
        this._toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true')
    }
}
