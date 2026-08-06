export default class FilterGroup extends ShopwareComponent {
    static options = {
        open: false,
        layout: 'bar',
        toggleComponent: 'ViewsTheme:Filter:Group:Toggle',
        countComponent: 'ViewsTheme:Filter:Group:Count',
        loadingEvent: 'ViewsTheme:Listing:Loading',
        viewportMargin: 8,
        minBodyHeight: 120,
        defaultPlacement: 'bottom-start',
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
        this._onLoading = this._onLoading.bind(this)

        window.Shopware.on(this.options.loadingEvent, this._onLoading)

        if (this._accordion) {
            this._setupAccordion()
            return
        }

        this._setupPopover()
    }

    destroy() {
        window.Shopware.off(this.options.loadingEvent, this._onLoading)
        this._body?.removeEventListener('toggle', this._onPopoverToggle)
        this._toggle?.removeEventListener('click', this._onAccordionClick)
        this._clearFit()
        this._toggle = null
        this._count = null
        this._body = null
    }

    setCount(count) {
        if (!this._count || !window.Shopware?.getComponentInstanceByElement) {
            return
        }

        const instance = window.Shopware.getComponentInstanceByElement(
            this.options.countComponent,
            this._count,
        )
        instance?.setCount?.(count)
    }

    setDisabled(disabled) {
        if (!this._toggle) {
            return
        }

        const on = !!disabled
        this._toggle.disabled = on

        if (on) {
            this.close()
            this._toggle.removeAttribute('popovertarget')
            return
        }

        if (!this._accordion && this._body?.id) {
            this._toggle.setAttribute('popovertarget', this._body.id)
            this._toggle.setAttribute('aria-haspopup', 'dialog')
        }
    }

    close() {
        if (this._accordion) {
            this._open = false
            this._syncAccordion()
            return
        }

        if (this._body && typeof this._body.hidePopover === 'function' && this._body.matches?.(':popover-open')) {
            this._body.hidePopover()
        }
    }

    _resolveBody() {
        const controls = this._toggle?.getAttribute('aria-controls')
            || this._toggle?.getAttribute('popovertarget')
        if (!controls) {
            return null
        }

        try {
            const local = this.el.querySelector(`#${CSS.escape(controls)}`)
            if (local) {
                return local
            }
        } catch {
            // invalid id
        }

        return document.getElementById(controls)
    }

    _setupPopover() {
        if (!this._body || !this.el.contains(this._body)) {
            this._body = this._resolveBody()
        }

        if (this._body) {
            if (!this._body.hasAttribute('popover')) {
                this._body.setAttribute('popover', 'auto')
            }
            this._body.removeAttribute('hidden')
            this._body.addEventListener('toggle', this._onPopoverToggle)
        }

        if (this._toggle && this._body?.id && !this._toggle.disabled) {
            this._toggle.setAttribute('popovertarget', this._body.id)
            this._toggle.setAttribute('aria-haspopup', 'dialog')
        }

        if (this.options.open && !this._toggle?.disabled && this._body && typeof this._body.showPopover === 'function') {
            this._body.showPopover()
        }

        this._syncAria(!!this._body?.matches?.(':popover-open'))
    }

    _setupAccordion() {
        if (!this._body || !this.el.contains(this._body)) {
            this._body = this._resolveBody()
        }

        if (this._body) {
            this._body.removeAttribute('popover')
            this._body.style.removeProperty('position-anchor')
        }

        if (this._toggle) {
            this._toggle.removeAttribute('popovertarget')
            this._toggle.addEventListener('click', this._onAccordionClick)
            if (this._toggle.disabled) {
                this._open = false
            }
        }

        this._open = !!this.options.open
        this._syncAccordion()
    }

    _onLoading(payload) {
        if (payload?.busy) {
            this.close()
        }
    }

    _onPopoverToggle(event) {
        const open = event.newState === 'open'
        this._syncAria(open)
        if (open) {
            this._fitPopover()
            return
        }
        this._clearFit()
    }

    _fitPopover() {
        if (!this._body || !this._toggle) {
            return
        }

        const margin = Number(this.options.viewportMargin) || 8
        const minH = Number(this.options.minBodyHeight) || 120
        const offset = this._anchorOffset()
        const toggleRect = this._toggle.getBoundingClientRect()
        const spaceBelow = window.innerHeight - toggleRect.bottom - offset - margin
        const spaceAbove = toggleRect.top - offset - margin
        const preferBottom = spaceBelow >= minH || spaceBelow >= spaceAbove
        const available = Math.max(minH, preferBottom ? spaceBelow : spaceAbove)
        const cap = Math.min(window.innerHeight * 0.7, 26 * 16)
        const bodyMax = Math.min(available, cap)

        this._body.setAttribute(
            'data-placement',
            preferBottom ? 'bottom-start' : 'top-start',
        )
        this._body.style.maxHeight = `${bodyMax}px`
    }

    _clearFit() {
        if (!this._body) {
            return
        }

        this._body.style.removeProperty('max-height')
        this._body.setAttribute(
            'data-placement',
            this.options.defaultPlacement || 'bottom-start',
        )
    }

    _anchorOffset() {
        if (!this._body) {
            return 4
        }

        const raw = getComputedStyle(this._body).getPropertyValue('--vi-offset').trim()
        if (!raw) {
            return 4
        }

        const px = Number.parseFloat(raw)
        if (Number.isFinite(px) && raw.endsWith('px')) {
            return px
        }
        if (Number.isFinite(px) && raw.endsWith('rem')) {
            const root = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
            return px * root
        }

        return 4
    }

    _onAccordionClick(event) {
        event.preventDefault()
        if (this._toggle?.disabled) {
            return
        }
        this._open = !this._open
        this._syncAccordion()
    }

    _syncAccordion() {
        this._syncAria(this._open)
        if (!this._body || !this.el.contains(this._body)) {
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
