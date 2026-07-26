export default class SearchOverlay extends ShopwareComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        barComponentName: 'ViewsTheme:Search:Bar',
        barSelector: '[data-component="ViewsTheme:Search:Bar"]',
        openEvent: 'ViewsTheme:Search:Overlay:Open',
        closeEvent: 'ViewsTheme:Search:Overlay:Close',
    }

    init() {
        this._open = false
        this._onKeydown = this._onKeydown.bind(this)

        this.el.inert = true
        document.addEventListener('keydown', this._onKeydown)
    }

    destroy() {
        document.removeEventListener('keydown', this._onKeydown)
        this._setBodyLock(false)
        this.el.inert = true
    }

    async open({ term = null } = {}) {
        if (!this._open) {
            this._open = true
            this.el.inert = false
            this.el.classList.remove(this.options.closedClass)
            this.el.classList.add(this.options.openClass)
            this.el.setAttribute('aria-hidden', 'false')
            this._setBodyLock(true)
        }

        const bar = await this._waitForBar()
        bar?.onOpened?.(term)

        window.Shopware.emitQueued(this.options.openEvent, {
            el: this.el,
            term,
        })

        bar?.focusInput?.()
    }

    close() {
        if (!this._open) {
            return
        }

        const term = this._bar()?.getTerm?.() ?? ''

        this._open = false
        this.el.classList.remove(this.options.openClass)
        this.el.classList.add(this.options.closedClass)
        this.el.setAttribute('aria-hidden', 'true')
        this.el.inert = true
        this._setBodyLock(false)

        window.Shopware.emitQueued(this.options.closeEvent, {
            el: this.el,
            term,
        })
    }

    isOpen() {
        return this._open
    }

    _bar() {
        const barEl = this.el.querySelector(this.options.barSelector)
        if (!barEl || !window.Shopware) {
            return null
        }

        return window.Shopware.getComponentInstanceByElement(
            this.options.barComponentName,
            barEl,
        )
    }

    async _waitForBar(retries = 20) {
        for (let i = 0; i < retries; i++) {
            const bar = this._bar()
            if (bar) {
                return bar
            }

            await new Promise((resolve) => {
                requestAnimationFrame(resolve)
            })
        }

        return this._bar()
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
