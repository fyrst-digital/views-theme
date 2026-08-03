export default class FilterGroup extends ShopwareComponent {
    static options = {
        open: false,
        toggleComponent: 'ViewsTheme:Filter:Group:Toggle',
        countComponent: 'ViewsTheme:Filter:Group:Count',
    }

    init() {
        this._open = !!this.options.open
        this._toggle = this.el.querySelector(
            `[data-component="${this.options.toggleComponent}"]`,
        )
        this._count = this.el.querySelector(
            `[data-component="${this.options.countComponent}"]`,
        )
        this._body = this._resolveBody()
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
        if (!this._count) {
            return
        }

        if (count) {
            this._count.hidden = false
            this._count.textContent = `(${count})`
            return
        }

        this._count.hidden = true
        this._count.textContent = ''
    }

    _resolveBody() {
        const controls = this._toggle?.getAttribute('aria-controls')
        if (!controls) {
            return null
        }

        return document.getElementById(controls)
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
        if (!this._body || !document.body.contains(this._body)) {
            this._body = this._resolveBody()
        }
        if (this._body) {
            this._body.hidden = !this._open
        }
    }
}
