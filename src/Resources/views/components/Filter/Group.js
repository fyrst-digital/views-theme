export default class FilterGroup extends ShopwareComponent {
    static options = {
        open: false,
        layout: 'bar',
        toggleComponent: 'ViewsTheme:Filter:Group:Toggle',
        countComponent: 'ViewsTheme:Filter:Group:Count',
    }

    init() {
        this._toggle = this.el.querySelector(
            `[data-component="${this.options.toggleComponent}"]`,
        )
        this._count = this.el.querySelector(
            `[data-component="${this.options.countComponent}"]`,
        )
        this._body = this._resolveBody()
        this._accordion = this.options.layout === 'stacked'
        this._onPopoverToggle = this._onPopoverToggle.bind(this)
        this._onAccordionClick = this._onAccordionClick.bind(this)

        if (this._accordion) {
            this._setupAccordion()
            return
        }

        this._setupPopover()
    }

    destroy() {
        this._body?.removeEventListener('toggle', this._onPopoverToggle)
        this._toggle?.removeEventListener('click', this._onAccordionClick)
        this._toggle = null
        this._count = null
        this._body = null
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
            || this._toggle?.getAttribute('popovertarget')
        if (!controls) {
            return null
        }

        return document.getElementById(controls)
    }

    _setupPopover() {
        if (!this._body || !document.body.contains(this._body)) {
            this._body = this._resolveBody()
        }

        if (this._body) {
            if (!this._body.hasAttribute('popover')) {
                this._body.setAttribute('popover', 'auto')
            }
            this._body.removeAttribute('hidden')
            this._body.addEventListener('toggle', this._onPopoverToggle)
        }

        if (this._toggle && this._body?.id) {
            this._toggle.setAttribute('popovertarget', this._body.id)
            this._toggle.setAttribute('aria-haspopup', 'dialog')
        }

        if (this.options.open && this._body && typeof this._body.showPopover === 'function') {
            this._body.showPopover()
        }

        this._syncAria(!!this._body?.matches?.(':popover-open'))
    }

    _setupAccordion() {
        if (!this._body || !document.body.contains(this._body)) {
            this._body = this._resolveBody()
        }

        if (this._body) {
            this._body.removeAttribute('popover')
            this._body.style.removeProperty('position-anchor')
        }

        if (this._toggle) {
            this._toggle.removeAttribute('popovertarget')
            this._toggle.addEventListener('click', this._onAccordionClick)
        }

        this._open = !!this.options.open
        this._syncAccordion()
    }

    _onPopoverToggle(event) {
        this._syncAria(event.newState === 'open')
    }

    _onAccordionClick(event) {
        event.preventDefault()
        this._open = !this._open
        this._syncAccordion()
    }

    _syncAccordion() {
        this._syncAria(this._open)
        if (!this._body || !document.body.contains(this._body)) {
            this._body = this._resolveBody()
        }
        if (this._body) {
            this._body.hidden = !this._open
        }
    }

    _syncAria(open) {
        this._toggle?.setAttribute('aria-expanded', open ? 'true' : 'false')
    }
}
