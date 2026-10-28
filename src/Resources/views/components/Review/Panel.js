import { createHistoryController } from '@views-theme/modules/review/history.js'
import { createReviewFetch } from '@views-theme/modules/review/fetch.js'
import {
    buildRequestParams,
    collectControlValues,
    urlParams,
} from '@views-theme/modules/review/params.js'
import {
    attach,
    connectedControls,
    hydrateControls,
    params as appliedParams,
} from '@views-theme/modules/review/store.js'
import { parseHtmlRoot, replaceComponentIsland } from '@views-theme/modules/shared/dom.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Review panel owner: URL SoT, list island XHR, save. Controls register
 * themselves (`review/store.js`); the panel never scans for them.
 *
 * @extends {ThemeComponent}
 */
export default class ReviewPanel extends ThemeComponent {
    static options = {
        listUrl: null,
        saveUrl: null,
        baseParams: {},
        history: true,
        listComponent: 'ViewsTheme:Review:Results',
        loadingEvent: 'ViewsTheme:Review:Loading',
        changedEvent: 'ViewsTheme:Review:Changed',
    }

    init() {
        this._onPopstate = this._onPopstate.bind(this)

        this._fetch = createReviewFetch({
            el: this.el,
            getOptions: () => this.options,
        })
        this._history = createHistoryController()

        if (this.options.history) {
            this.scope.on(window, 'popstate', this._onPopstate)
        }

        this.scope.add(attach(this))
        this.syncControls()
    }

    destroy() {
        this._fetch.abortAll()

        super.destroy()
    }

    /** Hydrate every connected control from the URL (init, popstate). */
    syncControls() {
        hydrateControls(urlParams())
    }

    /**
     * @param {Record<string, unknown>} [patch]
     * @param {{ pushHistory?: boolean, resetPage?: boolean }} [options]
     */
    async apply(patch = {}, options = {}) {
        const pushHistory = options.pushHistory !== false
        const controlValues = collectControlValues(connectedControls())
        const merged = {
            ...controlValues,
            ...patch,
        }

        if (options.resetPage !== false && patch.p === undefined) {
            merged.p = 1
        }

        const params = buildRequestParams(this.options, merged)

        this._setLoading(true)
        try {
            const html = await this._fetch.fetchList(params)
            if (!html) {
                return
            }

            // Set before the swap: Pagination in the new list hydrates from it on connect.
            appliedParams.set(params)
            replaceComponentIsland(this.el, html, this.options.listComponent)
            hydrateControls(params)

            if (pushHistory && this.options.history) {
                this._history.push(params, this.options, connectedControls())
            }

            window.Shopware.emitQueued(this.options.changedEvent, {
                source: this.el,
                params,
            })
        } finally {
            this._setLoading(false)
        }
    }

    /**
     * @param {FormData} formData
     */
    async save(formData) {
        this._setLoading(true)
        try {
            const html = await this._fetch.saveForm(formData)
            if (!html) {
                return
            }

            const next = parseHtmlRoot(html)
            if (!next) {
                return
            }

            this.el.replaceWith(next)
        } catch (error) {
            console.error('ViewsTheme:Review:Panel save failed', error)
        } finally {
            this._setLoading(false)
        }
    }

    /**
     * @param {PopStateEvent} _event
     */
    _onPopstate(_event) {
        if (this._history.shouldIgnorePopstate()) {
            return
        }
        this.syncControls()
        void this.apply({}, { pushHistory: false, resetPage: false })
    }

    /**
     * @param {boolean} busy
     */
    _setLoading(busy) {
        this.el.setAttribute('aria-busy', busy ? 'true' : 'false')
        window.Shopware.emitQueued(this.options.loadingEvent, {
            source: this.el,
            loading: busy,
        })
    }
}
