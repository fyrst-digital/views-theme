export default class NavigationBar extends ShopwareComponent {
    static options = {
        debounceTime: 150,
        switchDelay: 350,
        closeDelay: 200,
        flyoutComponentName: 'ViewsTheme:Navigation:Flyout',
        triggerAttr: 'data-flyout-trigger',
        navigationIdAttr: 'data-navigation-id',
        flyoutUrlAttr: 'data-flyout-url',
        activeAttr: 'data-active',
        openEvent: 'ViewsTheme:Navigation:Flyout:Open',
        closeEvent: 'ViewsTheme:Navigation:Flyout:Close',
    }

    init() {
        this._cache = {}
        this._openId = null
        this._requestId = 0
        this._abort = null
        this._flyoutEl = null
        this._triggerEl = null
        this._openTimer = null
        this._closeTimer = null
        this._pointerInside = false

        this._onPointerEnter = this._onPointerEnter.bind(this)
        this._onPointerLeave = this._onPointerLeave.bind(this)
        this._onFocusIn = this._onFocusIn.bind(this)
        this._onFocusOut = this._onFocusOut.bind(this)
        this._onKeydown = this._onKeydown.bind(this)
        this._onFlyoutOpen = this._onFlyoutOpen.bind(this)
        this._onFlyoutClose = this._onFlyoutClose.bind(this)
        this._onTriggerClick = this._onTriggerClick.bind(this)

        this.el.addEventListener('pointerenter', this._onPointerEnter, true)
        this.el.addEventListener('pointerleave', this._onPointerLeave)
        this.el.addEventListener('focusin', this._onFocusIn)
        this.el.addEventListener('focusout', this._onFocusOut)
        this.el.addEventListener('click', this._onTriggerClick)
        document.addEventListener('keydown', this._onKeydown)
        window.Shopware.on(this.options.openEvent, this._onFlyoutOpen)
        window.Shopware.on(this.options.closeEvent, this._onFlyoutClose)

        this._setActiveItems()
    }

    destroy() {
        this._clearOpenTimer()
        this._clearCloseTimer()
        this._abortFetch()
        this._unmountFlyout()

        this.el.removeEventListener('pointerenter', this._onPointerEnter, true)
        this.el.removeEventListener('pointerleave', this._onPointerLeave)
        this.el.removeEventListener('focusin', this._onFocusIn)
        this.el.removeEventListener('focusout', this._onFocusOut)
        this.el.removeEventListener('click', this._onTriggerClick)
        document.removeEventListener('keydown', this._onKeydown)
        window.Shopware.off(this.options.openEvent, this._onFlyoutOpen)
        window.Shopware.off(this.options.closeEvent, this._onFlyoutClose)
    }

    _onFlyoutOpen(payload = {}) {
        const el = this._eventEl(payload)
        if (!this._isOwnFlyout(el)) {
            return
        }

        this._setTriggerExpanded(this._triggerEl, true)
    }

    _onFlyoutClose(payload = {}) {
        const el = this._eventEl(payload)
        if (!this._isOwnFlyout(el)) {
            return
        }

        this._finishClose()
    }

    _onTriggerClick(event) {
        const trigger = this._triggerFromEvent(event)
        if (!trigger || trigger.matches('a[href]')) {
            return
        }

        event.preventDefault()
    }

    _onPointerEnter(event) {
        const trigger = this._triggerFromEvent(event)
        if (!trigger) {
            if (this._isInside(event.target)) {
                this._pointerInside = true
                this._clearCloseTimer()
                // Multi-row path: entering flyout must cancel a pending switch
                // from intermediate bar items the pointer crossed.
                this._clearOpenTimer()
            }
            return
        }

        this._pointerInside = true
        this._clearCloseTimer()
        this._scheduleOpen(trigger)
    }

    _onPointerLeave(event) {
        if (this._isInside(event.relatedTarget)) {
            return
        }

        this._pointerInside = false
        this._clearOpenTimer()
        this._scheduleClose()
    }

    _onFocusIn(event) {
        const trigger = this._triggerFromEvent(event)
        if (trigger) {
            this._clearCloseTimer()
            this._scheduleOpen(trigger)
            return
        }

        if (this._isInside(event.target)) {
            this._clearCloseTimer()
        }
    }

    _onFocusOut(event) {
        if (this._isInside(event.relatedTarget)) {
            return
        }

        this._clearOpenTimer()
        this._scheduleClose()
    }

    _onKeydown(event) {
        if (event.key !== 'Escape' || !this._openId) {
            return
        }

        event.preventDefault()
        const trigger = this._triggerEl
        this._close()
        if (trigger && typeof trigger.focus === 'function') {
            trigger.focus()
        }
    }

    _scheduleOpen(trigger) {
        const navigationId = trigger.getAttribute(this.options.navigationIdAttr)
        if (!navigationId) {
            return
        }

        if (this._openId === navigationId && this._flyoutEl) {
            return
        }

        const delay = this._openId && this._flyoutEl
            ? this.options.switchDelay
            : this.options.debounceTime

        this._clearOpenTimer()
        this._openTimer = window.setTimeout(() => {
            this._open(trigger)
        }, delay)
    }

    _scheduleClose() {
        this._clearCloseTimer()
        this._closeTimer = window.setTimeout(() => {
            if (!this._pointerInside && !this._hasFocusInside()) {
                this._close()
            }
        }, this.options.closeDelay)
    }

    async _open(trigger) {
        const navigationId = trigger.getAttribute(this.options.navigationIdAttr)
        const url = trigger.getAttribute(this.options.flyoutUrlAttr)

        if (!navigationId || !url) {
            return
        }

        if (this._openId === navigationId && this._flyoutEl) {
            this._setTriggerExpanded(trigger, true)
            return
        }

        this._setTriggerExpanded(this._triggerEl, false)
        this._triggerEl = trigger
        this._openId = navigationId
        this._setTriggerExpanded(trigger, true)

        const requestId = ++this._requestId

        try {
            const html = await this._fetch(navigationId, url)
            if (requestId !== this._requestId || this._openId !== navigationId) {
                return
            }

            if (!html) {
                this._resetOpenState()
                return
            }

            this._mountFlyout(html)
            const flyout = await this._waitForFlyoutInstance()

            if (requestId !== this._requestId || this._openId !== navigationId) {
                return
            }

            if (!flyout || typeof flyout.open !== 'function') {
                console.error('NavigationBar: Flyout instance missing after mount')
                this._resetOpenState()
                this._unmountFlyout()
                return
            }

            flyout.open()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }

            console.error('NavigationBar: Failed to open flyout', error)
            if (this._openId === navigationId) {
                this._resetOpenState()
                this._unmountFlyout()
            }
        }
    }

    _close() {
        this._clearOpenTimer()
        this._clearCloseTimer()
        this._abortFetch()
        this._requestId += 1

        const flyout = this._getFlyoutInstance()
        if (flyout && typeof flyout.close === 'function' && typeof flyout.isOpen === 'function' && flyout.isOpen()) {
            flyout.close()
            return
        }

        this._finishClose()
    }

    _finishClose() {
        this._setTriggerExpanded(this._triggerEl, false)
        this._unmountFlyout()
        this._openId = null
        this._triggerEl = null
    }

    _resetOpenState() {
        this._setTriggerExpanded(this._triggerEl, false)
        this._openId = null
        this._triggerEl = null
    }

    async _fetch(navigationId, url) {
        if (this._cache[navigationId]) {
            return this._cache[navigationId]
        }

        this._abortFetch()
        this._abort = new AbortController()

        const response = await fetch(url, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            signal: this._abort.signal,
        })

        if (response.status === 204) {
            return ''
        }

        if (!response.ok) {
            throw new Error(`Flyout fetch failed: ${response.status}`)
        }

        const html = await response.text()
        this._cache[navigationId] = html
        this._abort = null

        return html
    }

    _abortFetch() {
        if (this._abort) {
            this._abort.abort()
            this._abort = null
        }
    }

    _mountFlyout(html) {
        this._unmountFlyout()

        if (!html) {
            return
        }

        const root = this._parseRoot(html)
        if (!root) {
            return
        }

        this.el.append(root)
        this._flyoutEl = root
    }

    _unmountFlyout() {
        if (this._flyoutEl) {
            this._flyoutEl.remove()
            this._flyoutEl = null
            return
        }

        this.el.querySelector(`[data-component="${this.options.flyoutComponentName}"]`)?.remove()
    }

    _parseRoot(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    async _waitForFlyoutInstance(retries = 20) {
        for (let i = 0; i < retries; i++) {
            const flyout = this._getFlyoutInstance()
            if (flyout) {
                return flyout
            }

            await new Promise((resolve) => {
                requestAnimationFrame(resolve)
            })
        }

        return this._getFlyoutInstance()
    }

    _getFlyoutInstance() {
        if (!this._flyoutEl || !window.Shopware) {
            return null
        }

        return window.Shopware.getComponentInstanceByElement(
            this.options.flyoutComponentName,
            this._flyoutEl,
        )
    }

    _triggerFromEvent(event) {
        const target = event.target
        if (!(target instanceof Element)) {
            return null
        }

        const trigger = target.closest(`[${this.options.triggerAttr}]`)
        if (!trigger || !this.el.contains(trigger)) {
            return null
        }

        return trigger
    }

    _eventEl(payload) {
        if (payload && typeof payload === 'object' && 'el' in payload) {
            return payload.el
        }

        return payload
    }

    _isOwnFlyout(el) {
        if (!el) {
            return !this._flyoutEl
        }

        if (this._flyoutEl && el !== this._flyoutEl) {
            return false
        }

        return this.el.contains(el)
    }

    _isInside(node) {
        return node instanceof Node && this.el.contains(node)
    }

    _hasFocusInside() {
        return this._isInside(document.activeElement)
    }

    _setTriggerExpanded(trigger, expanded) {
        if (!trigger) {
            return
        }

        trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false')
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

    _clearOpenTimer() {
        if (this._openTimer) {
            window.clearTimeout(this._openTimer)
            this._openTimer = null
        }
    }

    _clearCloseTimer() {
        if (this._closeTimer) {
            window.clearTimeout(this._closeTimer)
            this._closeTimer = null
        }
    }
}
