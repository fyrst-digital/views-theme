export default class NavigationFlyout extends ShopwareComponent {
    static options = {
        openAttr: 'data-open',
        durationVar: '--vi-navigation-flyout-duration',
        durationFallback: 150,
        openEvent: 'ViewsTheme:Navigation:Flyout:Open',
        closeEvent: 'ViewsTheme:Navigation:Flyout:Close',
    }

    init() {
        this._open = false
        this._closing = false
        this._closeTimer = null
        this.el.setAttribute(this.options.openAttr, 'false')
    }

    destroy() {
        this._clearCloseWait()
    }

    open() {
        if (this._open && !this._closing) {
            return
        }

        this._clearCloseWait()
        this._closing = false
        this._open = true

        this.el.setAttribute(this.options.openAttr, 'false')
        void this.el.offsetWidth

        requestAnimationFrame(() => {
            this.el.setAttribute(this.options.openAttr, 'true')
        })

        window.Shopware.emitQueued(this.options.openEvent, { el: this.el })
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

    isOpen() {
        return this._open
    }

    _finishClose() {
        if (!this._closing) {
            return
        }

        this._clearCloseWait()
        this._closing = false
        this._open = false
        window.Shopware.emitQueued(this.options.closeEvent, { el: this.el })
    }

    _duration() {
        const raw = getComputedStyle(this.el).getPropertyValue(this.options.durationVar).trim()
        if (!raw) {
            return this.options.durationFallback
        }

        if (raw.endsWith('ms')) {
            return Number.parseFloat(raw) || this.options.durationFallback
        }

        if (raw.endsWith('s')) {
            return (Number.parseFloat(raw) || 0) * 1000 || this.options.durationFallback
        }

        return Number.parseFloat(raw) || this.options.durationFallback
    }

    _prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    _clearCloseWait() {
        if (this._closeTimer) {
            window.clearTimeout(this._closeTimer)
            this._closeTimer = null
        }
    }
}
