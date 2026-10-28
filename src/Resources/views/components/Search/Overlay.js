import { setBodyLock } from '@views-theme/modules/body-lock.js'
import { trapFocus } from '@views-theme/modules/shared/focus-trap.js'
import { registerShell, setShellOpen, shell, whenShellReady } from '@views-theme/modules/shared/shell-registry.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * @extends {ThemeComponent}
 */
export default class SearchOverlay extends ThemeComponent {
    static options = {
        openClass: 'd-flex',
        closedClass: 'd-none',
        bodyOpenClass: 'overflow-hidden',
        openEvent: 'ViewsTheme:Search:Overlay:Open',
        closeEvent: 'ViewsTheme:Search:Overlay:Close',
    }

    init() {
        this._open = false
        this._lockOwner = Symbol('search-overlay-body-lock')
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

    async open({ term = null } = {}) {
        if (!this._open) {
            this._open = true
            this.el.inert = false
            this.el.classList.remove(this.options.closedClass)
            this.el.classList.add(this.options.openClass)
            this.el.setAttribute('aria-hidden', 'false')
            this._setBodyLock(true)
        }

        const bar = await this._bar()
        bar?.onOpened?.(term)

        if (this._shellId) {
            setShellOpen(this._shellId, true, { term })
        }
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

        const term = this._barApi()?.getTerm?.() ?? ''

        this._open = false
        this.el.classList.remove(this.options.openClass)
        this.el.classList.add(this.options.closedClass)
        this.el.setAttribute('aria-hidden', 'true')
        this.el.inert = true
        this._setBodyLock(false)

        if (this._shellId) {
            setShellOpen(this._shellId, false, { term })
        }
        window.Shopware.emitQueued(this.options.closeEvent, {
            el: this.el,
            term,
        })
    }

    isOpen() {
        return this._open
    }

    /** The Bar registers itself as `<shellId>:bar` (see `Search/Bar.js`). */
    _barApi() {
        return shell(`${this._shellId}:bar`).api.get()
    }

    _bar() {
        return whenShellReady(`${this._shellId}:bar`)
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

    _setBodyLock(locked) {
        setBodyLock(this.options.bodyOpenClass, this._lockOwner, locked)
    }
}
