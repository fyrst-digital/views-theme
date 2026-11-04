import { parseHtmlRoot } from '@views-theme/modules/shared/dom.js'
import { fetchResponse } from '@views-theme/modules/shared/http.js'

/**
 * Desktop top-level bar with lazy flyouts.
 *
 * Every pointer / focus event resolves to one intended trigger (or `null`), and a
 * single timer moves the shown flyout there. Flyouts are fetched once per trigger,
 * inserted right after it (tab order: trigger → flyout → next trigger) and then only
 * shown / hidden as `popover="manual"`; CSS owns the open/close motion.
 *
 * @extends {ShopwareComponent}
 */
export default class NavigationBar extends ShopwareComponent {
    static options = {
        debounceTime: 150,
        switchDelay: 350,
        closeDelay: 200,
        widthAnchor: '--vi-navigation-bar',
        triggerAttr: 'data-flyout-trigger',
        navigationIdAttr: 'data-navigation-id',
        flyoutUrlAttr: 'data-flyout-url',
        activeAttr: 'data-active',
    }

    init() {
        /** @type {Map<Element, Promise<HTMLElement|null>>} */
        this._flyouts = new Map()
        /** @type {{ trigger: Element, el: HTMLElement }|null} */
        this._current = null
        /** @type {Element|null} */
        this._wanted = null
        this._timer = null

        this._onPointerOver = this._onPointerOver.bind(this)
        this._onPointerLeave = this._onPointerLeave.bind(this)
        this._onFocusIn = this._onFocusIn.bind(this)
        this._onFocusOut = this._onFocusOut.bind(this)
        this._onKeydown = this._onKeydown.bind(this)

        // `pointerover` bubbles on every target change; `pointerenter` would miss moving
        // from an item onto the bar's own empty space.
        this.el.addEventListener('pointerover', this._onPointerOver)
        this.el.addEventListener('pointerleave', this._onPointerLeave)
        this.el.addEventListener('focusin', this._onFocusIn)
        this.el.addEventListener('focusout', this._onFocusOut)
        document.addEventListener('keydown', this._onKeydown)

        this._setActiveItems()
    }

    destroy() {
        window.clearTimeout(this._timer)

        this.el.removeEventListener('pointerover', this._onPointerOver)
        this.el.removeEventListener('pointerleave', this._onPointerLeave)
        this.el.removeEventListener('focusin', this._onFocusIn)
        this.el.removeEventListener('focusout', this._onFocusOut)
        document.removeEventListener('keydown', this._onKeydown)
    }

    _onPointerOver(event) {
        // Over the open flyout (incl. its hover bridge): stay. Over a trigger: go there.
        // Anywhere else in the bar (leaf item, empty space): close.
        if (this._current?.el.contains(event.target)) {
            this._intend(this._current.trigger)
            return
        }

        this._intend(this._triggerOf(event.target))
    }

    _onPointerLeave() {
        this._intend(null)
    }

    _onFocusIn(event) {
        const trigger = this._triggerOf(event.target)
        if (trigger) {
            this._intend(trigger)
        } else if (this._current?.el.contains(event.target)) {
            this._intend(this._current.trigger)
        }
    }

    _onFocusOut(event) {
        // Clicking a non-focusable spot in the flyout blurs to `null`; keep it while hovered.
        if (this.el.contains(event.relatedTarget) || this.el.matches(':hover')) {
            return
        }

        this._intend(null)
    }

    _onKeydown(event) {
        if (event.key !== 'Escape' || !this._current) {
            return
        }

        event.preventDefault()
        // Refocus first: its focusin then targets the shown flyout and cannot schedule a reopen.
        if (this.el.contains(document.activeElement)) {
            this._current.trigger.focus()
        }

        window.clearTimeout(this._timer)
        this._wanted = null
        this._show(null)
    }

    /**
     * @param {Element|null} trigger flyout trigger to show, or `null` to close
     */
    _intend(trigger) {
        if (trigger === this._wanted) {
            return
        }

        this._wanted = trigger
        window.clearTimeout(this._timer)

        // Back on the shown flyout: cancelling the pending switch / close is enough.
        if (trigger === (this._current?.trigger ?? null)) {
            return
        }

        let delay = this.options.debounceTime
        if (!trigger) {
            delay = this.options.closeDelay
        } else if (this._current) {
            // Longer dwell so a path into the panel that crosses other items keeps it.
            delay = this.options.switchDelay
        }

        this._timer = window.setTimeout(() => this._show(trigger), delay)
    }

    /**
     * @param {Element|null} trigger
     */
    async _show(trigger) {
        if (this._current) {
            this._current.el.hidePopover()
            this._current.trigger.setAttribute('aria-expanded', 'false')
            this._current = null
        }

        if (!trigger) {
            return
        }

        const el = await this._flyout(trigger)
        // Stale: the intent moved on, or a concurrent call for this trigger already showed it.
        if (!el || this._wanted !== trigger || this._current) {
            return
        }

        el.showPopover()
        trigger.setAttribute('aria-expanded', 'true')
        this._current = { trigger, el }
    }

    /**
     * @param {Element} trigger
     * @returns {Promise<HTMLElement|null>}
     */
    _flyout(trigger) {
        if (!this._flyouts.has(trigger)) {
            this._flyouts.set(trigger, this._load(trigger))
        }

        return this._flyouts.get(trigger)
    }

    /**
     * Fetch and insert a hidden flyout. Empty (`204`) caches `null`; a failure is
     * dropped from the cache so the next hover retries.
     *
     * @param {Element} trigger
     * @returns {Promise<HTMLElement|null>}
     */
    async _load(trigger) {
        try {
            const response = await fetchResponse(trigger.getAttribute(this.options.flyoutUrlAttr))
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const el = /** @type {HTMLElement|null} */ (parseHtmlRoot(await response.text()))
            if (el) {
                el.style.setProperty('--vi-flyout-width-anchor', this.options.widthAnchor)
                trigger.after(el)
            }

            return el
        } catch (error) {
            this._flyouts.delete(trigger)
            console.error('NavigationBar: failed to load flyout', error)

            return null
        }
    }

    /**
     * @param {EventTarget|null} target
     * @returns {Element|null}
     */
    _triggerOf(target) {
        if (!(target instanceof Element)) {
            return null
        }

        const trigger = target.closest(`[${this.options.triggerAttr}]`)

        return trigger && this.el.contains(trigger) ? trigger : null
    }

    _setActiveItems() {
        const activeId = window.activeNavigationId
        const pathIds = window.activeNavigationPathIdList || []
        const ids = new Set([
            ...(activeId ? [String(activeId)] : []),
            ...pathIds.map((id) => String(id)),
        ])

        if (ids.size === 0) {
            return
        }

        this.el.querySelectorAll(`[${this.options.navigationIdAttr}]`).forEach((el) => {
            if (!el.matches('a, button')) {
                return
            }

            const id = el.getAttribute(this.options.navigationIdAttr)
            if (!id || !ids.has(String(id))) {
                return
            }

            el.setAttribute(this.options.activeAttr, 'true')
            el.classList.add('fw-semibold')
            if (activeId && String(id) === String(activeId)) {
                el.setAttribute('aria-current', 'page')
            }
        })
    }
}
