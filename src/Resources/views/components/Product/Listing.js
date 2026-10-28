import {
    activeLabels,
    all,
    collectValues,
    controlsVersion,
    hydrate,
    hydrateFromUrl,
    setAvailability,
    setOptionsPayload,
} from '@views-theme/modules/listing/controls.js'
import { createListingFetch } from '@views-theme/modules/listing/fetch.js'
import { controlFilterKey } from '@views-theme/modules/listing/filter-options.js'
import { createHistoryController } from '@views-theme/modules/listing/history.js'
import { buildRequestParams } from '@views-theme/modules/listing/params.js'
import {
    readAriaLiveText,
    replaceResults,
    scrollToListing,
} from '@views-theme/modules/listing/results-dom.js'
import { attach } from '@views-theme/modules/listing/store.js'
import { busy, labels, liveText, params as appliedParams } from '@views-theme/modules/listing/state.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Product listing owner: URL SoT, Results XHR, filter-options. Controls register
 * themselves (`listing/controls.js`); the owner never scans for them.
 *
 * @extends {ThemeComponent}
 */
export default class ProductListing extends ThemeComponent {
    /** @type {import('@views-theme/modules/types.js').ListingOptions} */
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
        changedEvent: 'ViewsTheme:Listing:Changed',
        syncedEvent: 'ViewsTheme:Listing:ControlsSynced',
        availabilitySyncedEvent: 'ViewsTheme:Listing:AvailabilitySynced',
        loadingEvent: 'ViewsTheme:Listing:Loading',
        scrollOffset: 15,
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
        this._busy = false
        /** @type {{ params: Record<string, unknown>, pushHistory: boolean }|null} */
        this._queued = null
        this._onPopstate = this._onPopstate.bind(this)

        /** @type {import('@views-theme/modules/types.js').ListingModuleContext} */
        const ctx = {
            el: this.el,
            getOptions: () => /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
        }
        this._fetch = createListingFetch(ctx)
        this._history = createHistoryController()

        if (this.options.history) {
            this.scope.on(window, 'popstate', this._onPopstate)
        }

        this.scope.add(attach(this))
        // Chips follow control connect / disconnect (drawer open / close, Results swap).
        this.scope.watch(controlsVersion, () => {
            labels.set(this.getActiveLabels())
        })
        this.syncControls()
        void this.syncFilterOptions()
    }

    destroy() {
        this._fetch.abortAll()
        this._queued = null

        super.destroy()
    }

    /** Hydrate every connected control from the current URL query. */
    hydrateFromUrl() {
        hydrateFromUrl()
    }

    /**
     * Hydrate connected controls from the URL (init, popstate) and refresh the chips.
     */
    syncControls() {
        this.hydrateFromUrl()
        labels.set(this.getActiveLabels())
        window.Shopware.emitQueued(this.options.syncedEvent, { source: this.el })
    }

    /**
     * Batch-refetch filter option lists (server order + disabled) and meta.
     *
     * @param {Record<string, unknown>|import('@views-theme/modules/types.js').ListingRequestParams|null} [params]
     * @param {{ built?: boolean }} [options]
     * @returns {Promise<void>}
     */
    async syncFilterOptions(params = null, options = {}) {
        if (!this.options.disableEmptyFilter) {
            return
        }

        if (this.options.filterOptionsUrl) {
            await this._withAvailabilityLoading(async () => {
                const requestParams = this._resolveParams(params, options)
                const payload = await this._fetch.fetchFilterOptions(requestParams)
                if (!payload) {
                    return
                }
                this._applyOptions(payload)
                this._emitAvailability(true, requestParams)
            }, 'filter-options-failed')
            return
        }

        await this.syncAvailability(params, options)
    }

    /**
     * Fallback: reduced aggregations JSON → applyAvailability on controls.
     *
     * @param {Record<string, unknown>|import('@views-theme/modules/types.js').ListingRequestParams|null} [params]
     * @param {{ built?: boolean }} [options]
     * @returns {Promise<void>}
     */
    async syncAvailability(params = null, options = {}) {
        if (!this.options.disableEmptyFilter || !this.options.aggregationsUrl) {
            return
        }

        await this._withAvailabilityLoading(async () => {
            const requestParams = this._resolveParams(params, options)
            const aggregations = await this._fetch.fetchAggregations(requestParams)
            if (!aggregations) {
                return
            }
            setAvailability(aggregations)
            this._emitAvailability(true, requestParams)
        }, 'availability-failed')
    }

    /**
     * @param {Record<string, unknown>} [patch]
     * @param {{ pushHistory?: boolean, resetPage?: boolean }} [options]
     */
    apply(patch = {}, options = {}) {
        const pushHistory = options.pushHistory !== false
        const resetPage = options.resetPage !== false
        const next = { ...collectValues(), ...patch }

        if (resetPage && patch.p === undefined) {
            next.p = 1
        }

        this._enqueue(next, pushHistory)
    }

    /**
     * @param {string} id
     */
    reset(id) {
        all().forEach((control) => {
            if (typeof control.reset === 'function') {
                control.reset(id)
            }
        })
        this.apply({ p: 1 }, { resetPage: false })
    }

    /**
     * Clear facets by filter key. Omitted keys clear every control.
     *
     * @param {string|string[]|null} [keys]
     */
    resetFilters(keys = null) {
        const wanted = filterKeySet(keys)
        all().forEach((control) => {
            if (typeof control.resetAll !== 'function') {
                return
            }
            if (wanted && !wanted.has(controlFilterKey(control) || '')) {
                return
            }
            control.resetAll()
        })
        this.apply({ p: 1 }, { resetPage: false })
    }

    resetAll() {
        this.resetFilters(null)
    }

    /**
     * @returns {import('@views-theme/modules/types.js').ListingLabel[]}
     */
    getActiveLabels() {
        return activeLabels()
    }

    /**
     * @param {Record<string, unknown>|import('@views-theme/modules/types.js').ListingRequestParams|null} params
     * @param {{ built?: boolean }} [options]
     * @returns {import('@views-theme/modules/types.js').ListingRequestParams}
     */
    _resolveParams(params, options = {}) {
        if (options.built) {
            return /** @type {import('@views-theme/modules/types.js').ListingRequestParams} */ (params || {})
        }
        return buildRequestParams(
            /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
            params ?? collectValues(),
        )
    }

    /**
     * @param {import('@views-theme/modules/types.js').FilterOptionsPayload} payload
     */
    _applyOptions(payload) {
        setOptionsPayload(payload)
    }

    /**
     * @param {boolean} ok
     * @param {import('@views-theme/modules/types.js').ListingRequestParams|Record<string, never>} params
     * @param {string|null} [error]
     */
    _emitAvailability(ok, params, error = null) {
        window.Shopware.emitQueued(this.options.availabilitySyncedEvent, {
            ok,
            params,
            error,
            source: this.el,
        })
    }

    /**
     * @param {() => Promise<void>} runner
     * @param {string} failCode
     * @returns {Promise<void>}
     */
    async _withAvailabilityLoading(runner, failCode) {
        const standalone = !this._busy
        if (standalone) {
            busy.set(true)
            window.Shopware.emitQueued(this.options.loadingEvent, {
                busy: true,
                source: this.el,
                availability: true,
            })
        }

        try {
            await runner()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error(`ProductListing: ${failCode}`, error)
            this._emitAvailability(false, {}, error?.message || failCode)
        } finally {
            if (standalone) {
                busy.set(false)
                window.Shopware.emitQueued(this.options.loadingEvent, {
                    busy: false,
                    source: this.el,
                    availability: true,
                })
            }
        }
    }

    /**
     * @param {Record<string, unknown>} params
     * @param {boolean} pushHistory
     */
    _enqueue(params, pushHistory) {
        this._queued = { params, pushHistory }
        if (!this._busy) {
            void this._runQueue()
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async _runQueue() {
        if (this._busy) {
            return
        }

        this._busy = true
        busy.set(true)
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
            busy.set(false)
            this.el.removeAttribute('aria-busy')
            window.Shopware.emitQueued(this.options.loadingEvent, { busy: false, source: this.el })
        }
    }

    /**
     * @param {Record<string, unknown>} params
     * @param {boolean} pushHistory
     * @returns {Promise<void>}
     */
    async _fetchAndApply(params, pushHistory) {
        if (!this.options.resultsUrl) {
            console.error('ProductListing: resultsUrl is missing')
            return
        }

        const requestParams = buildRequestParams(
            /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
            params,
        )
        const optionsRequested = Boolean(
            this.options.disableEmptyFilter && this.options.filterOptionsUrl,
        )

        try {
            const resultsPromise = this._fetch.fetchResultsHtml(requestParams)
            const optionsPromise = optionsRequested
                ? this._fetch.fetchFilterOptions(requestParams)
                : Promise.resolve(undefined)

            const html = await resultsPromise

            // Set before the swap: Pagination / Sorting in the new Results hydrate from these on connect.
            appliedParams.set(requestParams)
            replaceResults(this.el, html, this.options.resultsComponent)

            if (pushHistory && this.options.history) {
                this._history.push(
                    requestParams,
                    /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
                    all(),
                )
            }
            hydrate(requestParams)
            scrollToListing(this.el, this.options.scrollOffset)

            /** @type {import('@views-theme/modules/types.js').FilterOptionsPayload|null|undefined} */
            let optionsPayload = undefined
            if (optionsRequested) {
                try {
                    optionsPayload = await optionsPromise
                } catch (error) {
                    if (error?.name !== 'AbortError') {
                        throw error
                    }
                    optionsPayload = null
                }
            }

            if (optionsPayload) {
                hydrate(requestParams)
                this._applyOptions(optionsPayload)
                this._emitAvailability(true, requestParams)
            } else if (optionsPayload === undefined && this.options.disableEmptyFilter) {
                await this.syncFilterOptions(requestParams, { built: true })
            }

            const liveMessage = readAriaLiveText(
                /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
                this.el,
            )
            if (liveMessage) {
                liveText.set({ text: liveMessage })
            }

            labels.set(this.getActiveLabels())

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

    _onPopstate() {
        if (this._history.shouldIgnorePopstate()) {
            return
        }

        this.syncControls()
        this._enqueue(collectValues(), false)
    }
}

/**
 * @param {string|string[]|null|undefined} keys
 * @returns {Set<string>|null} null means every control
 */
function filterKeySet(keys) {
    if (keys == null || keys === '') {
        return null
    }

    const list = Array.isArray(keys) ? keys : [keys]
    /** @type {Set<string>} */
    const wanted = new Set()
    list.forEach((key) => {
        if (key != null && String(key) !== '') {
            wanted.add(String(key))
        }
    })

    return wanted
}
