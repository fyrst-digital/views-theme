import { setBodyLock } from '@views-theme/modules/body-lock.js'
import { galleries } from '@views-theme/modules/gallery/store.js'
import { trapFocus } from '@views-theme/modules/shared/focus-trap.js'
import { registerShell, setShellOpen } from '@views-theme/modules/shared/shell-registry.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Fullscreen gallery dialog shell.
 *
 * @extends {ThemeComponent}
 */
export default class GalleryFullscreen extends ThemeComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        galleryId: null,
        openEvent: 'ViewsTheme:Gallery:Fullscreen:Open',
        closeEvent: 'ViewsTheme:Gallery:Fullscreen:Close',
    }

    init() {
        this._open = false
        this._lockOwner = Symbol('gallery-fullscreen-body-lock')
        this._onKeydown = this._onKeydown.bind(this)

        this.el.inert = true
        this.scope.on(document, 'keydown', this._onKeydown)

        this._shellId = this.el.id
        this.scope.add(this._shellId ? registerShell(this._shellId, this, this.el) : null)
    }

    destroy() {
        this._setBodyLock(false)
        this.el.inert = true

        super.destroy()
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

        const openIndex = this._galleryIndex()
        if (this._shellId) {
            setShellOpen(this._shellId, true, { index: openIndex })
        }
        window.Shopware.emitQueued(this.options.openEvent, {
            el: this.el,
            index: openIndex,
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

        if (this._shellId) {
            setShellOpen(this._shellId, false, { index })
        }
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
        return galleries.peek(this.options.galleryId)?.index.get() ?? 0
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
