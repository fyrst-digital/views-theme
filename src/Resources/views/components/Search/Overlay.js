export default class SearchOverlay extends ShopwareComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        inputSelector: 'input[type="search"]',
        openEvent: 'ViewsTheme:Search:Overlay:Open',
        closeEvent: 'ViewsTheme:Search:Overlay:Close',
    }

    init() {
        this._open = false
        this._onKeydown = this._onKeydown.bind(this)
        this._input = this.el.querySelector(this.options.inputSelector)

        this.el.inert = true
        document.addEventListener('keydown', this._onKeydown)
        this.open()
    }

    destroy() {
        document.removeEventListener('keydown', this._onKeydown)
        this._setBodyLock(false)
        this.el.inert = true
    }

    open() {
        if (this._open) {
            this._focusInput()
            return
        }

        this._open = true
        this.el.inert = false
        this.el.classList.remove(this.options.closedClass)
        this.el.classList.add(this.options.openClass)
        this.el.setAttribute('aria-hidden', 'false')
        this._setBodyLock(true)
        this._focusInput()
        window.Shopware.emitQueued(this.options.openEvent, this.el)
    }

    close() {
        if (!this._open) {
            return
        }

        this._open = false
        this.el.classList.remove(this.options.openClass)
        this.el.classList.add(this.options.closedClass)
        this.el.setAttribute('aria-hidden', 'true')
        this.el.inert = true
        this._setBodyLock(false)
        window.Shopware.emitQueued(this.options.closeEvent, this.el)
    }

    isOpen() {
        return this._open
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

    _focusInput() {
        if (!this._input) {
            return
        }

        requestAnimationFrame(() => {
            this._input.focus()
        })
    }

    _setBodyLock(locked) {
        document.body.classList.toggle(this.options.bodyOpenClass, locked)
    }
}
