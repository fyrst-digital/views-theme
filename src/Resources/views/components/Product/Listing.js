export default class ProductListing extends ShopwareComponent {
    static options = {
        resultsUrl: null,
        aggregationsUrl: null,
        filterOptionsUrl: null,
        baseParams: {},
        display: {},
        disableEmptyFilter: false,
        ariaLiveUpdates: true,
        history: true,
        resultsComponent: 'ViewsTheme:Product:Listing:Results',
        panelComponent: 'ViewsTheme:Filter:Panel',
        changedEvent: 'ViewsTheme:Listing:Changed',
        syncedEvent: 'ViewsTheme:Listing:ControlsSynced',
        availabilitySyncedEvent: 'ViewsTheme:Listing:AvailabilitySynced',
        loadingEvent: 'ViewsTheme:Listing:Loading',
        scrollOffset: 15,
        controlComponents: [
            'ViewsTheme:Pagination',
            'ViewsTheme:Sorting',
            'ViewsTheme:Filter:MultiSelect',
            'ViewsTheme:Filter:Boolean',
            'ViewsTheme:Filter:Range',
            'ViewsTheme:Filter:Rating',
        ],
        displayParamKeys: [
            'boxLayout',
            'referrerCategoryId',
            'no-aggregations',
            'only-aggregations',
            'reduce-aggregations',
            'slots',
        ],
    }

    init() {
        this._controls = new Set()
        this._busy = false
        this._queued = null
        this._abort = null
        this._ignorePopstate = false
        this._onPopstate = this._onPopstate.bind(this)

        if (this.options.history) {
            window.addEventListener('popstate', this._onPopstate)
        }

        this.syncControls()
        requestAnimationFrame(() => {
            this.syncControls()
            void this.syncFilterOptions()
        })
    }

    destroy() {
        window.removeEventListener('popstate', this._onPopstate)
        this._abortFetch()
        this._controls.clear()
        this._queued = null
    }

    /**
     * Re-scan control components (e.g. after Filter:Drawer mount/unmount).
     */
    refreshControls() {
        this._pruneControls()
        this._discoverControls()
    }

    /**
     * Hydrate every registered control from the current URL query.
     */
    hydrateFromUrl() {
        this._hydrateControlsFromUrl()
    }

    /**
     * Discover controls then hydrate from URL (lazy Filter:Drawer open, init, popstate).
     * Emits ControlsSynced so Filter:Active can refresh chips (callMethod has no return value).
     * Does not apply reduced-aggregation availability — call syncAvailability() after.
     */
    syncControls() {
        this.refreshControls()
        this.hydrateFromUrl()
        window.Shopware.emitQueued(this.options.syncedEvent, { source: this.el })
    }

    /**
     * Batch-refetch filter option lists (server order + disabled) and meta.
     * Prefer filterOptionsUrl; falls back to reduced aggregations JSON.
     *
     * @param {Record<string, unknown>|null} [params]
     * @param {{ built?: boolean }} [options]
     */
    async syncFilterOptions(params = null, options = {}) {
        if (!this.options.disableEmptyFilter) {
            return
        }

        if (this.options.filterOptionsUrl) {
            await this._syncFilterOptionsBatch(params, options)
            return
        }

        await this.syncAvailability(params, options)
    }

    /**
     * Fallback: reduced aggregations JSON → applyAvailability on controls.
     *
     * @param {Record<string, unknown>|null} [params]
     * @param {{ built?: boolean }} [options]
     */
    async syncAvailability(params = null, options = {}) {
        if (!this.options.disableEmptyFilter || !this.options.aggregationsUrl) {
            return
        }

        this.refreshControls()

        const requestParams = options.built
            ? (params || {})
            : this._buildRequestParams(params ?? this._collectValues())

        const standalone = !this._busy
        if (standalone) {
            window.Shopware.emitQueued(this.options.loadingEvent, {
                busy: true,
                source: this.el,
                availability: true,
            })
        }

        try {
            await this._fetchAndApplyAvailability(requestParams)
            window.Shopware.emitQueued(this.options.availabilitySyncedEvent, {
                ok: true,
                params: requestParams,
                source: this.el,
            })
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('ProductListing: Failed to sync filter availability', error)
            window.Shopware.emitQueued(this.options.availabilitySyncedEvent, {
                ok: false,
                error: error?.message || 'availability-failed',
                source: this.el,
            })
        } finally {
            if (standalone) {
                window.Shopware.emitQueued(this.options.loadingEvent, {
                    busy: false,
                    source: this.el,
                    availability: true,
                })
            }
        }
    }

    /**
     * @param {Record<string, unknown>|null} [params]
     * @param {{ built?: boolean }} [options]
     */
    async _syncFilterOptionsBatch(params = null, options = {}) {
        if (!this.options.filterOptionsUrl) {
            return
        }

        this.refreshControls()

        const requestParams = options.built
            ? (params || {})
            : this._buildRequestParams(params ?? this._collectValues())

        const standalone = !this._busy
        if (standalone) {
            window.Shopware.emitQueued(this.options.loadingEvent, {
                busy: true,
                source: this.el,
                availability: true,
            })
        }

        try {
            const payload = await this._fetchFilterOptions(requestParams)
            this._applyFilterOptionsPayload(payload)
            window.Shopware.emitQueued(this.options.availabilitySyncedEvent, {
                ok: true,
                params: requestParams,
                source: this.el,
            })
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('ProductListing: Failed to sync filter options', error)
            window.Shopware.emitQueued(this.options.availabilitySyncedEvent, {
                ok: false,
                error: error?.message || 'filter-options-failed',
                source: this.el,
            })
        } finally {
            if (standalone) {
                window.Shopware.emitQueued(this.options.loadingEvent, {
                    busy: false,
                    source: this.el,
                    availability: true,
                })
            }
        }
    }

    registerControl(control) {
        if (!control || typeof control.getValues !== 'function') {
            return
        }

        this._pruneControls()
        this._controls.add(control)
    }

    unregisterControl(control) {
        this._controls.delete(control)
    }

    _pruneControls() {
        this._controls.forEach((control) => {
            if (!control.el || !document.body.contains(control.el)) {
                this._controls.delete(control)
            }
        })
    }

    _discoverIn(root) {
        if (!root || !window.Shopware?.getComponentInstanceByElement) {
            return
        }

        const names = this.options.controlComponents || []
        names.forEach((name) => {
            root.querySelectorAll(`[data-component="${name}"]`).forEach((el) => {
                const instance = window.Shopware.getComponentInstanceByElement(name, el)
                if (instance) {
                    this.registerControl(instance)
                }
            })
        })
    }

    _discoverControls() {
        this._discoverIn(this.el)

        const panelName = this.options.panelComponent || 'ViewsTheme:Filter:Panel'
        // Drop facet controls under any panel, then re-add only the active surface
        // (open filter drawer wins over hidden desktop sidebar panel).
        this._controls.forEach((control) => {
            if (control.el?.closest(`[data-component="${panelName}"]`)) {
                this._controls.delete(control)
            }
        })

        this._activeFilterPanels().forEach((panel) => {
            this._discoverIn(panel)
        })
    }

    /**
     * When Filter:Drawer is open, only its Panel controls count.
     * Otherwise use page panels (exclude any leftover drawer mount).
     * Prefer aria-hidden/d-flex over data-open (open attr flips one frame later).
     */
    _activeFilterPanels() {
        const panelName = this.options.panelComponent || 'ViewsTheme:Filter:Panel'
        const panels = [...document.querySelectorAll(`[data-component="${panelName}"]`)]
        const drawer = document.querySelector('#vi-filter-drawer')
        const drawerActive = Boolean(
            drawer
            && drawer.classList.contains('d-flex')
            && drawer.getAttribute('aria-hidden') !== 'true',
        )

        if (drawerActive) {
            return panels.filter((panel) => drawer.contains(panel))
        }

        return panels.filter((panel) => !panel.closest('#vi-filter-drawer'))
    }

    _hydrateControlsFromUrl() {
        const params = this._urlParams()
        this._controls.forEach((control) => {
            if (typeof control.setFromUrl === 'function') {
                control.setFromUrl(params)
            }
        })
    }

    /**
     * @param {Record<string, unknown>} patch
     * @param {{ pushHistory?: boolean, resetPage?: boolean }} [options]
     */
    apply(patch = {}, options = {}) {
        const pushHistory = options.pushHistory !== false
        const resetPage = options.resetPage !== false
        const next = { ...this._collectValues(), ...patch }

        if (resetPage && patch.p === undefined) {
            next.p = 1
        }

        this._enqueue(next, pushHistory)
    }

    reset(id) {
        this.refreshControls()
        this._controls.forEach((control) => {
            if (typeof control.reset === 'function') {
                control.reset(id)
            }
        })
        this.apply({ p: 1 }, { resetPage: false })
    }

    resetAll() {
        this.refreshControls()
        this._controls.forEach((control) => {
            if (typeof control.resetAll === 'function') {
                control.resetAll()
            }
        })
        this.apply({ p: 1 }, { resetPage: false })
    }

    getActiveLabels() {
        this.refreshControls()

        const labels = []
        const seen = new Set()
        this._controls.forEach((control) => {
            if (typeof control.getLabels !== 'function') {
                return
            }

            control.getLabels().forEach((item) => {
                const id = item?.id
                if (id !== undefined && id !== null && seen.has(String(id))) {
                    return
                }
                if (id !== undefined && id !== null) {
                    seen.add(String(id))
                }
                labels.push(item)
            })
        })
        return labels
    }

    _enqueue(params, pushHistory) {
        this._queued = { params, pushHistory }
        if (!this._busy) {
            this._runQueue()
        }
    }

    async _runQueue() {
        if (this._busy) {
            return
        }

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')
        window.Shopware.emitQueued(this.options.loadingEvent, { busy: true, source: this.el })

        try {
            while (this._queued) {
                const job = this._queued
                this._queued = null
                await this._fetchAndApply(job.params, job.pushHistory)
            }
        } finally {
            this._busy = false
            this.el.removeAttribute('aria-busy')
            window.Shopware.emitQueued(this.options.loadingEvent, { busy: false, source: this.el })
        }
    }

    async _fetchAndApply(params, pushHistory) {
        if (!this.options.resultsUrl) {
            console.error('ProductListing: resultsUrl is missing')
            return
        }

        this._pruneControls()
        const requestParams = this._buildRequestParams(params)

        try {
            const resultsPromise = this._fetchHtml(this.options.resultsUrl, requestParams)
            const optionsPromise = this.options.disableEmptyFilter && this.options.filterOptionsUrl
                ? this._fetchFilterOptions(requestParams)
                : Promise.resolve(null)

            const [html, optionsPayload] = await Promise.all([resultsPromise, optionsPromise])

            this._replaceResults(html)
            this._scrollToListing()

            if (pushHistory && this.options.history) {
                this._pushHistory(requestParams)
            }

            if (optionsPayload) {
                this.refreshControls()
                this._applyFilterOptionsPayload(optionsPayload)
                window.Shopware.emitQueued(this.options.availabilitySyncedEvent, {
                    ok: true,
                    params: requestParams,
                    source: this.el,
                })
            } else {
                await this.syncFilterOptions(requestParams, { built: true })
            }

            this._updateAriaLive()

            window.Shopware.emitQueued(this.options.changedEvent, {
                ok: true,
                params: requestParams,
                source: this.el,
            })
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }

            console.error('ProductListing: Failed to refresh listing', error)
            window.Shopware.emitQueued(this.options.changedEvent, {
                ok: false,
                error: error?.message || 'listing-failed',
                source: this.el,
            })
        }
    }

    _objectOption(value) {
        if (!value || Array.isArray(value)) {
            return {}
        }
        return typeof value === 'object' ? value : {}
    }

    _buildRequestParams(controlParams) {
        const merged = {
            ...this._objectOption(this.options.baseParams),
            ...this._objectOption(this.options.display),
            ...controlParams,
        }

        const out = {}
        Object.entries(merged).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
                return
            }
            if (Array.isArray(value)) {
                if (value.length) {
                    out[key] = value.join('|')
                }
                return
            }
            out[key] = String(value)
        })

        return out
    }

    _collectValues() {
        this.refreshControls()

        const values = {}
        this._controls.forEach((control) => {
            const part = control.getValues() || {}
            Object.entries(part).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    const merged = [...(values[key] || []), ...value]
                    values[key] = [...new Set(merged)]
                    return
                }
                if (value !== null && value !== undefined && value !== '') {
                    values[key] = value
                }
            })
        })
        return values
    }

    _listingHistoryKeys() {
        const keys = new Set(['p', 'order'])

        Object.keys(this._objectOption(this.options.baseParams)).forEach((key) => {
            keys.add(key)
        })

        this.refreshControls()
        this._controls.forEach((control) => {
            const fromMethod = typeof control.getParamKeys === 'function'
                ? control.getParamKeys()
                : []
            const list = Array.isArray(fromMethod) ? fromMethod : []
            list.forEach((key) => keys.add(key))
        })

        return keys
    }

    async _fetchHtml(url, params) {
        this._abortFetch()
        this._abort = new AbortController()

        const target = new URL(url, window.location.origin)
        Object.entries(params).forEach(([key, value]) => {
            target.searchParams.set(key, value)
        })

        const response = await fetch(target.toString(), {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            signal: this._abort.signal,
        })

        if (!response.ok) {
            throw new Error(`Listing fetch failed: ${response.status}`)
        }

        return response.text()
    }

    async _fetchAndApplyAvailability(params) {
        const target = new URL(this.options.aggregationsUrl, window.location.origin)
        const skip = new Set(this.options.displayParamKeys || [])
        skip.add('p')
        skip.add('order')

        Object.entries(params).forEach(([key, value]) => {
            if (skip.has(key)) {
                return
            }
            target.searchParams.set(key, value)
        })

        const response = await fetch(target.toString(), {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })

        if (!response.ok) {
            throw new Error(`Availability fetch failed: ${response.status}`)
        }

        const aggregations = await response.json()
        this._applyAvailability(aggregations)
    }

    async _fetchFilterOptions(params) {
        const target = new URL(this.options.filterOptionsUrl, window.location.origin)
        const skip = new Set(this.options.displayParamKeys || [])
        skip.add('p')
        skip.add('order')

        Object.entries(params).forEach(([key, value]) => {
            if (skip.has(key)) {
                return
            }
            target.searchParams.set(key, value)
        })

        const response = await fetch(target.toString(), {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })

        if (!response.ok) {
            throw new Error(`Filter options fetch failed: ${response.status}`)
        }

        return response.json()
    }

    /**
     * @param {{ options?: Record<string, string>, meta?: Record<string, Record<string, unknown>> }} payload
     */
    _applyFilterOptionsPayload(payload) {
        if (!payload || typeof payload !== 'object') {
            return
        }

        this.refreshControls()
        const options = payload.options || {}
        const meta = payload.meta || {}

        this._controls.forEach((control) => {
            const key = control.options?.filterKey
                || control.el?.getAttribute?.('data-filter-key')
                || control.options?.name
            if (!key) {
                return
            }

            if (typeof options[key] === 'string' && typeof control.replaceOptions === 'function') {
                control.replaceOptions(options[key])
            }

            if (meta[key] && typeof control.applyOptionsMeta === 'function') {
                control.applyOptionsMeta(meta[key])
            } else if (meta[key] && typeof control.applyAvailability !== 'function') {
                // no-op
            }
        })

        // Controls discovered only by data-filter-key (e.g. not yet in set)
        document.querySelectorAll('[data-filter-key]').forEach((el) => {
            const key = el.getAttribute('data-filter-key')
            if (!key) {
                return
            }
            const name = el.getAttribute('data-component')
            if (!name || !window.Shopware?.getComponentInstanceByElement) {
                return
            }
            const instance = window.Shopware.getComponentInstanceByElement(name, el)
            if (!instance) {
                return
            }
            if (typeof options[key] === 'string' && typeof instance.replaceOptions === 'function') {
                instance.replaceOptions(options[key])
            }
            if (meta[key] && typeof instance.applyOptionsMeta === 'function') {
                instance.applyOptionsMeta(meta[key])
            }
        })
    }

    _applyAvailability(aggregations) {
        this._controls.forEach((control) => {
            if (typeof control.applyAvailability === 'function') {
                control.applyAvailability(aggregations)
                return
            }
            if (typeof control.refreshDisabled === 'function') {
                control.refreshDisabled(aggregations)
            }
        })
    }

    _replaceResults(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        const next = template.content.querySelector(
            `[data-component="${this.options.resultsComponent}"]`,
        )
        const existing = this.el.querySelector(
            `[data-component="${this.options.resultsComponent}"]`,
        )

        if (existing && next) {
            existing.replaceWith(next)
            return
        }

        if (!existing && next) {
            this.el.appendChild(next)
        }
    }

    _pushHistory(params) {
        const skip = new Set(this.options.displayParamKeys || [])
        const listingKeys = this._listingHistoryKeys()
        const url = new URL(window.location.href)

        listingKeys.forEach((key) => {
            url.searchParams.delete(key)
        })

        Object.entries(params).forEach(([key, value]) => {
            if (skip.has(key)) {
                return
            }
            url.searchParams.set(key, value)
        })

        this._ignorePopstate = true
        window.history.pushState({}, '', url.toString())
        queueMicrotask(() => {
            this._ignorePopstate = false
        })
    }

    _onPopstate() {
        if (this._ignorePopstate) {
            return
        }

        this.syncControls()
        this._enqueue(this._collectValues(), false)
    }

    _urlParams() {
        return Object.fromEntries(new URLSearchParams(window.location.search).entries())
    }

    _scrollToListing() {
        const rect = this.el.getBoundingClientRect()
        if (rect.top >= 0) {
            return
        }

        const top = rect.top + window.scrollY - (this.options.scrollOffset || 0)
        window.scrollTo({ top, behavior: 'smooth' })
    }

    _updateAriaLive() {
        if (!this.options.ariaLiveUpdates) {
            return
        }

        const results = this.el.querySelector(
            `[data-component="${this.options.resultsComponent}"]`,
        )
        const text = results?.getAttribute('data-aria-live-text')
        if (!text) {
            return
        }

        const panelName = this.options.panelComponent || 'ViewsTheme:Filter:Panel'
        document.querySelectorAll(`[data-component="${panelName}"]`).forEach((panel) => {
            const live = panel.querySelector('[data-aria-live]')
            if (live) {
                live.textContent = text
            }
        })
    }

    _abortFetch() {
        if (this._abort) {
            this._abort.abort()
            this._abort = null
        }
    }
}
