export default class ProductListing extends ShopwareComponent {
    static options = {
        resultsUrl: null,
        aggregationsUrl: null,
        baseParams: {},
        display: {},
        disableEmptyFilter: false,
        ariaLiveUpdates: true,
        history: true,
        resultsComponent: 'ViewsTheme:Product:Listing:Results',
        panelComponent: 'ViewsTheme:Filter:Panel',
        changedEvent: 'ViewsTheme:Listing:Changed',
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

        this.refreshControls()
        this._hydrateControlsFromUrl()
        requestAnimationFrame(() => {
            this.refreshControls()
            this._hydrateControlsFromUrl()
        })
    }

    destroy() {
        window.removeEventListener('popstate', this._onPopstate)
        this._abortFetch()
        this._controls.clear()
        this._queued = null
    }

    /**
     * Re-scan control components (e.g. after Filter:Panel moves into/out of Drawer).
     */
    refreshControls() {
        this._pruneControls()
        this._discoverControls()
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
        document.querySelectorAll(`[data-component="${panelName}"]`).forEach((panel) => {
            this._discoverIn(panel)
        })
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
        this._controls.forEach((control) => {
            if (typeof control.getLabels === 'function') {
                labels.push(...control.getLabels())
            }
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
            const html = await this._fetchHtml(this.options.resultsUrl, requestParams)
            this._replaceResults(html)
            this._scrollToListing()

            if (pushHistory && this.options.history) {
                this._pushHistory(requestParams)
            }

            if (this.options.disableEmptyFilter && this.options.aggregationsUrl) {
                await this._refreshAggregations(requestParams)
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
                    values[key] = [...(values[key] || []), ...value]
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

    async _refreshAggregations(params) {
        try {
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
                return
            }

            const aggregations = await response.json()
            this._controls.forEach((control) => {
                if (typeof control.refreshDisabled === 'function') {
                    control.refreshDisabled(aggregations)
                }
            })
        } catch (error) {
            console.error('ProductListing: Failed to refresh aggregations', error)
        }
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

        this.refreshControls()
        this._hydrateControlsFromUrl()
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
