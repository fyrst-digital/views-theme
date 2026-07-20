export default class SearchOverlay extends ShopwareComponent {
    static options = {
        openClass: 'is-open',
        bodyOpenClass: 'vi-search-overlay-open',
        backdropRef: 'backdrop',
        closeRef: 'close',
        inputSelector: 'input[type="search"]',
    }

    init() {
        this._open = false
        this._onKeydown = this._onKeydown.bind(this)
        this._onBackdropClick = this._onBackdropClick.bind(this)
        this._onCloseClick = this._onCloseClick.bind(this)

        this._backdrop = this.el.querySelector(`[data-ref="${this.options.backdropRef}"]`)
        this._closeButton = this.el.querySelector(`[data-ref="${this.options.closeRef}"]`)
        this._input = this.el.querySelector(this.options.inputSelector)

        this._registerEvents()
        this.open()
    }

    destroy() {
        this._unregisterEvents()
        this._setBodyLock(false)
    }

    open() {
        if (this._open) {
            this._focusInput()
            return
        }

        this._open = true
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
        this.el.setAttribute('aria-hidden', 'true')
        this._setBodyLock(false)
        this.el.dispatchEvent(new CustomEvent('ViewsTheme:Search:Overlay:close', { bubbles: true }))
    }

    isOpen() {
        return this._open
    }

    _registerEvents() {
        document.addEventListener('keydown', this._onKeydown)

        if (this._backdrop) {
            this._backdrop.addEventListener('click', this._onBackdropClick)
        }

        if (this._closeButton) {
            this._closeButton.addEventListener('click', this._onCloseClick)
        }
    }

    _unregisterEvents() {
        document.removeEventListener('keydown', this._onKeydown)

        if (this._backdrop) {
            this._backdrop.removeEventListener('click', this._onBackdropClick)
        }

        if (this._closeButton) {
            this._closeButton.removeEventListener('click', this._onCloseClick)
        }
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

    _onBackdropClick() {
        this.close()
    }

    _onCloseClick() {
        this.close()
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
