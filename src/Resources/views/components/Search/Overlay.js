export default class SearchOverlay extends ShopwareComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        inputSelector: 'input[type="search"]',
        dismissEvent: 'ViewsTheme:Search:Overlay:dismiss',
    }

    init() {
        this._open = false
        this._onDismiss = this._onDismiss.bind(this)
        this._onKeydown = this._onKeydown.bind(this)
        this._input = this.el.querySelector(this.options.inputSelector)

        this.el.addEventListener(this.options.dismissEvent, this._onDismiss)
        document.addEventListener('keydown', this._onKeydown)
        this.open()
    }

    destroy() {
        this.el.removeEventListener(this.options.dismissEvent, this._onDismiss)
        document.removeEventListener('keydown', this._onKeydown)
        this._setBodyLock(false)
    }

    open() {
        if (this._open) {
            this._focusInput()
            return
        }

        this._open = true
        this.el.classList.remove(this.options.closedClass)
        this.el.classList.add(this.options.openClass)
        this.el.setAttribute('aria-hidden', 'false')
        this._setBodyLock(true)
        this._focusInput()
        this.el.dispatchEvent(new CustomEvent('ViewsTheme:Search:Overlay:open', { bubbles: true }))
    }

    close() {
        if (!this._open) {
            return
        }

        this._open = false
        this.el.classList.remove(this.options.openClass)
        this.el.classList.add(this.options.closedClass)
        this.el.setAttribute('aria-hidden', 'true')
        this._setBodyLock(false)
        this.el.dispatchEvent(new CustomEvent('ViewsTheme:Search:Overlay:close', { bubbles: true }))
    }

    isOpen() {
        return this._open
    }

    _onDismiss(event) {
        event.preventDefault?.()
        this.close()
    }

    _onKeydown(event) {
        if (!this._open) {
            return
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            this.close()
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
