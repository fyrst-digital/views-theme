export default class SearchOverlayBackdrop extends ShopwareComponent {
    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    _onClick(event) {
        event.preventDefault()
        this.el.dispatchEvent(new CustomEvent('ViewsTheme:Search:Overlay:dismiss', {
            bubbles: true,
        }))
    }
}
