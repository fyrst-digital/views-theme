/** Selection badge: count SoT is options; DOM is a paint. */
export default class FilterGroupCount extends ShopwareComponent {
    static options = {
        count: null,
    }

    setCount(count) {
        this.options.count = count || null
        this._paint()
    }

    _paint() {
        const count = this.options.count

        if (count) {
            this.el.hidden = false
            this.el.textContent = String(count)
            return
        }

        this.el.hidden = true
        this.el.textContent = ''
    }
}
