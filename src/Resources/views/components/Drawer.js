export default class Drawer extends ShopwareComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
        openAttr: 'data-open',
        duration: 250,
        panelSelector: '[data-action="panel"]',
    }

    init() {
        this._open = false
        this._closing = false
        this._closeTimer = null
        this._onKeydown = this._onKeydown.bind(this)
        this._onTransitionEnd = this._onTransitionEnd.bind(this)

        this.el.inert = true
        this.el.setAttribute(this.options.openAttr, 'false')
        document.addEventListener('keydown', this._onKeydown)
        this.open()
    }

    destroy() {
        this._clearCloseWait()
        document.removeEventListener('keydown', this._onKeydown)
        this._setBodyLock(false)
        this.el.inert = true
    }

    open() {
        if (this._open && !this._closing) {
            this._focusFirst()
            return
        }

        this._clearCloseWait()
        this._closing = false
        this._open = true

        this.el.inert = false
        this.el.classList.remove(this.options.closedClass)
        this.el.classList.add(this.options.openClass)
        this.el.setAttribute('aria-hidden', 'false')
        this._setBodyLock(true)

        // Ensure closed transform paints before opening
        this.el.setAttribute(this.options.openAttr, 'false')
        // force reflow
        void this.el.offsetWidth

        requestAnimationFrame(() => {
            this.el.setAttribute(this.options.openAttr, 'true')
        })

        this._focusFirst()
        window.Shopware.emitQueued(this.options.openEvent, this.el)
    }

    close() {
        if (!this._open && !this._closing) {
            return
        }

        if (this._closing) {
            return
        }

        this._open = false
        this._closing = true
        this.el.setAttribute(this.options.openAttr, 'false')

        if (this._prefersReducedMotion()) {
            this._finishClose()
            return
        }

        const panel = this.el.querySelector(this.options.panelSelector)
        if (panel) {
            panel.addEventListener('transitionend', this._onTransitionEnd)
        }

        this._closeTimer = window.setTimeout(() => {
            this._finishClose()
        }, this.options.duration + 50)
    }

    isOpen() {
        return this._open
    }

    _onTransitionEnd(event) {
        if (event.target !== this.el.querySelector(this.options.panelSelector)) {
            return
        }

        if (event.propertyName !== 'transform') {
            return
        }

        this._finishClose()
    }

    _finishClose() {
        if (!this._closing) {
            return
        }

        this._clearCloseWait()
        this._closing = false

        this.el.classList.remove(this.options.openClass)
        this.el.classList.add(this.options.closedClass)
        this.el.setAttribute('aria-hidden', 'true')
        this.el.inert = true
        this._setBodyLock(false)
        window.Shopware.emitQueued(this.options.closeEvent, this.el)
    }

    _clearCloseWait() {
        if (this._closeTimer !== null) {
            window.clearTimeout(this._closeTimer)
            this._closeTimer = null
        }

        const panel = this.el.querySelector(this.options.panelSelector)
        if (panel) {
            panel.removeEventListener('transitionend', this._onTransitionEnd)
        }
    }

    _prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    _onKeydown(event) {
        if (!this._open) {
            return
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            this.close()
            return
        }

        if (event.key === 'Tab') {
            this._trapFocus(event)
        }
    }

    _trapFocus(event) {
        const focusables = Array.from(
            window.focusHandler.getFocusableElements(this.el),
        )

        if (!focusables.length) {
            event.preventDefault()
            return
        }

        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement

        if (event.shiftKey) {
            if (active === first || !this.el.contains(active)) {
                event.preventDefault()
                window.focusHandler.setFocus(last, { focusVisible: true })
            }
            return
        }

        if (active === last || !this.el.contains(active)) {
            event.preventDefault()
            window.focusHandler.setFocus(first, { focusVisible: true })
        }
    }

    _focusFirst() {
        requestAnimationFrame(() => {
            const focusables = window.focusHandler.getFocusableElements(this.el)
            const target = focusables[0] || this.el
            window.focusHandler.setFocus(target, { focusVisible: true })
        })
    }

    _setBodyLock(locked) {
        document.body.classList.toggle(this.options.bodyOpenClass, locked)
    }
}
