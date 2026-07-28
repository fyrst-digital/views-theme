export default class NavigationFlyout extends ShopwareComponent {
    static options = {
        durationVar: '--vi-flyout-duration',
        durationFallback: 150,
        openEvent: 'ViewsTheme:Navigation:Flyout:Open',
        closeEvent: 'ViewsTheme:Navigation:Flyout:Close',
    }

    init() {
        this._open = false
        this._closing = false
        this._closeTimer = null
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

        if (typeof this.el.showPopover === 'function') {
            this.el.showPopover()
        }

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

        if (typeof this.el.hidePopover === 'function' && this.el.matches(':popover-open')) {
            this.el.hidePopover()
        }

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
