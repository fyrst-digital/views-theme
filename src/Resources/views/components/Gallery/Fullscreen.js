import { setBodyLock } from '@views-theme/modules/body-lock.js'
import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Fullscreen gallery dialog shell.
 *
 * @extends {ShopwareComponent}
 */
export default class GalleryFullscreen extends ShopwareComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        galleryComponent: 'ViewsTheme:Gallery',
        gallerySelector: '[data-component="ViewsTheme:Gallery"]',
        openEvent: 'ViewsTheme:Gallery:Fullscreen:Open',
        closeEvent: 'ViewsTheme:Gallery:Fullscreen:Close',
    }

    init() {
        this._open = false
        this._lockOwner = Symbol('gallery-fullscreen-body-lock')
        this._onKeydown = this._onKeydown.bind(this)

        this.el.inert = true
        document.addEventListener('keydown', this._onKeydown)
    }

    destroy() {
        document.removeEventListener('keydown', this._onKeydown)
        this._setBodyLock(false)
        this.el.inert = true
    }

    async open() {
        if (!this._open) {
            this._open = true
            this.el.inert = false
            this.el.classList.remove(this.options.closedClass)
            this.el.classList.add(this.options.openClass)
            this.el.setAttribute('aria-hidden', 'false')
            this._setBodyLock(true)
        }

        window.Shopware.emitQueued(this.options.openEvent, {
            el: this.el,
            index: this._galleryIndex(),
        })

        this._focusClose()
    }

    close() {
        if (!this._open) {
            return
        }

        const index = this._galleryIndex()

        this._open = false
        this.el.classList.remove(this.options.openClass)
        this.el.classList.add(this.options.closedClass)
        this.el.setAttribute('aria-hidden', 'true')
        this.el.inert = true
        this._setBodyLock(false)

        window.Shopware.emitQueued(this.options.closeEvent, {
            el: this.el,
            index,
        })
    }

    isOpen() {
        return this._open
    }

    /**
     * @returns {number}
     */
    _galleryIndex() {
        const gallery = this._gallery()
        if (gallery && typeof gallery.getIndex === 'function') {
            return Number(gallery.getIndex()) || 0
        }
        return 0
    }

    /**
     * @returns {import('../Gallery.js').default|null}
     */
    _gallery() {
        const name = this.options.galleryComponent
        const el = this.el.querySelector(this.options.gallerySelector)
        return getInstanceByElement(name, el)
    }

    _focusClose() {
        const close = this.el.querySelector(
            '[data-component="ViewsTheme:Gallery:Fullscreen:Close"]',
        )
        if (close) {
            requestAnimationFrame(() => {
                window.focusHandler?.setFocus?.(close, { focusVisible: true })
                    ?? close.focus()
            })
        }
    }

    /**
     * @param {KeyboardEvent} event
     */
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

    /**
     * @param {KeyboardEvent} event
     */
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

    /**
     * @param {boolean} locked
     */
    _setBodyLock(locked) {
        setBodyLock(this.options.bodyOpenClass, this._lockOwner, locked)
    }
}
