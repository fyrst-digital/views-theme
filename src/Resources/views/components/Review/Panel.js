import { createHistoryController } from '@views-theme/modules/review/history.js'
import { createReviewFetch } from '@views-theme/modules/review/fetch.js'
import {
    buildRequestParams,
    collectControlValues,
    urlParams,
} from '@views-theme/modules/review/params.js'
import { getInstanceByElement, waitForComponentsIn } from '@views-theme/modules/shared/component.js'
import { parseHtmlRoot, replaceComponentIsland } from '@views-theme/modules/shared/dom.js'

const RESULTS_CONTROL_NAMES = [
    'ViewsTheme:Pagination',
    'ViewsTheme:Review:Sort',
    'ViewsTheme:Review:Language',
]

/**
 * Review panel owner: URL SoT, list island XHR, form mode, save.
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewPanel extends ShopwareComponent {
    static options = {
        listUrl: null,
        saveUrl: null,
        baseParams: {},
        history: true,
        listComponent: 'ViewsTheme:Review:Results',
        controlComponents: [
            'ViewsTheme:Pagination',
            'ViewsTheme:Review:Sort',
            'ViewsTheme:Review:Language',
            'ViewsTheme:Review:Matrix',
        ],
        loadingEvent: 'ViewsTheme:Review:Loading',
        changedEvent: 'ViewsTheme:Review:Changed',
    }

    init() {
        /** @type {Set<object>} */
        this._controls = new Set()
        this._onPopstate = this._onPopstate.bind(this)

        this._fetch = createReviewFetch({
            el: this.el,
            getOptions: () => this.options,
        })
        this._history = createHistoryController()

        if (this.options.history) {
            window.addEventListener('popstate', this._onPopstate)
        }

        this.syncControls()
        requestAnimationFrame(() => this.syncControls())
    }

    destroy() {
        window.removeEventListener('popstate', this._onPopstate)
        this._fetch.abortAll()
        this._controls.clear()
    }

    openForm() {
        this._setMode('form')
    }

    closeForm() {
        this._setMode('list')
    }

    /**
     * @param {'list'|'form'} mode
     */
    setMode(mode) {
        this._setMode(mode === 'form' ? 'form' : 'list')
    }

    refreshControls() {
        this._controls.forEach((control) => {
            if (!control.el || !document.body.contains(control.el)) {
                this._controls.delete(control)
            }
        })

        const names = this.options.controlComponents || []
        names.forEach((name) => {
            this.el.querySelectorAll(`[data-component="${name}"]`).forEach((el) => {
                const instance = getInstanceByElement(name, el)
                if (instance && typeof instance.getValues === 'function') {
                    this._controls.add(instance)
                }
            })
        })
    }

    hydrateFromUrl() {
        const params = urlParams()
        this._controls.forEach((control) => {
            if (typeof control.setFromUrl === 'function') {
                control.setFromUrl(params)
            }
        })
    }

    syncControls() {
        this.refreshControls()
        this.hydrateFromUrl()
    }

    /**
     * @param {Record<string, unknown>} [patch]
     * @param {{ pushHistory?: boolean, resetPage?: boolean }} [options]
     */
    async apply(patch = {}, options = {}) {
        const pushHistory = options.pushHistory !== false
        const controlValues = collectControlValues(this._controls)
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

            replaceComponentIsland(this.el, html, this.options.listComponent)
            this._syncRegionVisibility()

            const results = this.el.querySelector(
                `[data-component="${this.options.listComponent}"]`,
            )
            if (results) {
                await waitForComponentsIn(results, RESULTS_CONTROL_NAMES)
            }

            this.syncControls()

            this._controls.forEach((control) => {
                if (typeof control.setFromUrl === 'function') {
                    control.setFromUrl(params)
                }
            })

            if (pushHistory && this.options.history) {
                this._history.push(params, this.options, this._controls)
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
     * @param {'list'|'form'} mode
     */
    _setMode(mode) {
        this.el.setAttribute('data-review-mode', mode)
        this._syncRegionVisibility()

        window.Shopware.emitQueued('ViewsTheme:Review:Mode', {
            source: this.el,
            mode,
        })
    }

    _syncRegionVisibility() {
        const mode = this.el.getAttribute('data-review-mode') === 'form' ? 'form' : 'list'
        const formRegion = this.el.querySelector('[data-review-region="form"]')
        const listRegion = this.el.querySelector(
            `[data-component="${this.options.listComponent}"]`,
        )

        if (formRegion instanceof HTMLElement) {
            formRegion.hidden = mode !== 'form'
        }
        if (listRegion instanceof HTMLElement) {
            listRegion.hidden = mode !== 'list'
        }
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
