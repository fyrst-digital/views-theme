import { setBodyLock } from '@views-theme/modules/body-lock.js'
import { trapFocus } from '@views-theme/modules/shared/focus-trap.js'

/**
 * Centered card dialog shell — open/close, body lock, Escape, Tab trap.
 *
 * @extends {ShopwareComponent}
 */
export default class Modal extends ShopwareComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        openEvent: 'ViewsTheme:Modal:Open',
        closeEvent: 'ViewsTheme:Modal:Close',
        openAttr: 'data-open',
        durationVar: '--vi-modal-duration',
        durationFallback: 250,
    }

    init() {
        this._open = false
        this._closing = false
        this._closeTimer = null
        this._lockOwner = Symbol('modal-body-lock')
        this._onKeydown = this._onKeydown.bind(this)

        this.el.inert = true
        this.el.setAttribute(this.options.openAttr, 'false')
        document.addEventListener('keydown', this._onKeydown)
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
        window.Shopware.emitQueued(this.options.closeEvent, { el: this.el })
    }

    _clearCloseWait() {
        if (this._closeTimer !== null) {
            window.clearTimeout(this._closeTimer)
            this._closeTimer = null
        }
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
            trapFocus(event, this.el)
        }
    }

    /**
     * @param {boolean} locked
     */
    _setBodyLock(locked) {
        setBodyLock(this.options.bodyOpenClass, this._lockOwner, locked)
    }
}
