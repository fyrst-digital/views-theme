import { createControlsRegistry } from '@views-theme/modules/listing/controls.js'
import { createListingFetch } from '@views-theme/modules/listing/fetch.js'
import { applyAvailability, applyFilterOptionsPayload } from '@views-theme/modules/listing/filter-options.js'
import { createHistoryController } from '@views-theme/modules/listing/history.js'
import { buildRequestParams } from '@views-theme/modules/listing/params.js'
import {
    replaceResults,
    scrollToListing,
    updateAriaLive,
    waitForResultsControls,
} from '@views-theme/modules/listing/results-dom.js'

/**
 * Product listing owner: URL SoT, control registry, Results XHR, filter-options.
 *
 * @extends {ShopwareComponent}
 */
export default class ProductListing extends ShopwareComponent {
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
        this._busy = false
        /** @type {{ params: Record<string, unknown>, pushHistory: boolean }|null} */
        this._queued = null
        this._onPopstate = this._onPopstate.bind(this)

        /** @type {import('@views-theme/modules/types.js').ListingModuleContext} */
        const ctx = {
            el: this.el,
            getOptions: () => /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
        }
        this._registry = createControlsRegistry(ctx)
        this._fetch = createListingFetch(ctx)
        this._history = createHistoryController()

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
        this._fetch.abortAll()
        this._registry.clear()
        this._queued = null
    }

    /** Re-scan control components (e.g. after Filter:Drawer mount/unmount). */
    refreshControls() {
        this._registry.refresh()
    }

    /** Hydrate every registered control from the current URL query. */
    hydrateFromUrl() {
        this._registry.hydrateFromUrl()
    }

    /**
     * Discover controls then hydrate from URL (lazy Filter:Drawer open, init, popstate).
     */
    syncControls() {
        this.refreshControls()
        this.hydrateFromUrl()
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
                this.refreshControls()
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
            this.refreshControls()
            const requestParams = this._resolveParams(params, options)
            const aggregations = await this._fetch.fetchAggregations(requestParams)
            if (!aggregations) {
                return
            }
            applyAvailability(this._registry.values(), aggregations)
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
        const next = { ...this._registry.collectValues(), ...patch }

        if (resetPage && patch.p === undefined) {
            next.p = 1
        }

        this._enqueue(next, pushHistory)
    }

    /**
     * @param {string} id
     */
    reset(id) {
        this.refreshControls()
        this._registry.forEach((control) => {
            if (typeof control.reset === 'function') {
                control.reset(id)
            }
        })
        this.apply({ p: 1 }, { resetPage: false })
    }

    resetAll() {
        this.refreshControls()
        this._registry.forEach((control) => {
            if (typeof control.resetAll === 'function') {
                control.resetAll()
            }
        })
        this.apply({ p: 1 }, { resetPage: false })
    }

    /**
     * @returns {import('@views-theme/modules/types.js').ListingLabel[]}
     */
    getActiveLabels() {
        return this._registry.getActiveLabels()
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
            params ?? this._registry.collectValues(),
        )
    }

    /**
     * @param {import('@views-theme/modules/types.js').FilterOptionsPayload} payload
     */
    _applyOptions(payload) {
        this.refreshControls()
        applyFilterOptionsPayload(this._registry.values(), payload)
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

        this._registry.prune()
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

            replaceResults(this.el, html, this.options.resultsComponent)
            await waitForResultsControls(this.el, this.options.resultsComponent)
            this.refreshControls()

            if (pushHistory && this.options.history) {
                this._history.push(
                    requestParams,
                    /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
                    this._registry.values(),
                )
            }
            this._registry.hydrateFromParams(requestParams)
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
                this.refreshControls()
                this._registry.hydrateFromParams(requestParams)
                this._applyOptions(optionsPayload)
                this._emitAvailability(true, requestParams)
            } else if (optionsPayload === undefined && this.options.disableEmptyFilter) {
                await this.syncFilterOptions(requestParams, { built: true })
            }

            updateAriaLive(
                /** @type {import('@views-theme/modules/types.js').ListingOptions} */ (this.options),
                this.el,
            )

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
        this._enqueue(this._registry.collectValues(), false)
    }
}
