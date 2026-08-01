export default class FilterGroup extends ShopwareComponent {
    static options = {
        open: false,
    }

    init() {
        this._open = !!this.options.open
        this._toggle = this.el.querySelector('button[aria-controls]')
        this._body = this._toggle
            ? this.el.querySelector(`#${CSS.escape(this._toggle.getAttribute('aria-controls'))}`)
            : null
        this._onToggle = this._onToggle.bind(this)

        if (this._toggle) {
            this._toggle.addEventListener('click', this._onToggle)
        }

        this._sync()
    }

    destroy() {
        if (this._toggle) {
            this._toggle.removeEventListener('click', this._onToggle)
        }
    }

    setCount(count) {
        const el = this.el.querySelector('[data-filter-count]')
        if (!el) {
            return
        }

        if (count) {
            el.hidden = false
            el.textContent = `(${count})`
            return
        }

        el.hidden = true
        el.textContent = ''
    }

    _onToggle(event) {
        event.preventDefault()
        this._open = !this._open
        this._sync()
    }

    _sync() {
        if (this._toggle) {
            this._toggle.setAttribute('aria-expanded', this._open ? 'true' : 'false')
        }
        if (this._body) {
            this._body.hidden = !this._open
        }
    }
}
