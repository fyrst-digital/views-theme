export default class Drawer extends ShopwareComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        openEvent: 'ViewsTheme:Drawer:Open',
        closeEvent: 'ViewsTheme:Drawer:Close',
        openAttr: 'data-open',
        durationVar: '--vi-drawer-duration',
        durationFallback: 250,
    }

    init() {
        this._open = false
        this._closing = false
        this._closeTimer = null
        this._onKeydown = this._onKeydown.bind(this)

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

        this.el.setAttribute(this.options.openAttr, 'false')
        void this.el.offsetWidth

        requestAnimationFrame(() => {
            this.el.setAttribute(this.options.openAttr, 'true')
        })

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

        this._closeTimer = window.setTimeout(() => {
            this._finishClose()
        }, this._duration() + 50)
    }

    onPanelTransitionEnd() {
        if (!this._closing) {
            return
        }

        this._finishClose()
    }

    isOpen() {
        return this._open
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
    }

    _duration() {
        const raw = getComputedStyle(this.el)
            .getPropertyValue(this.options.durationVar)
        const ms = parseFloat(raw)

        return Number.isFinite(ms) ? ms : this.options.durationFallback
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

    _setBodyLock(locked) {
        document.body.classList.toggle(this.options.bodyOpenClass, locked)
    }
}
