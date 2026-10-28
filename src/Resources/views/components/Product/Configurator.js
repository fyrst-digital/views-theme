import { configurators } from '@views-theme/modules/configurator/store.js'
import { fetchJson, urlWithParams } from '@views-theme/modules/shared/http.js'
import { hideLoader, showLoader } from '@views-theme/modules/shared/loader.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

const FOCUS_KEY = 'variant-switch'

/**
 * Product configurator owner. Provides itself to the store session and calls the Shopware switch API.
 *
 * @extends {ThemeComponent}
 */
export default class ProductConfigurator extends ThemeComponent {
    static options = {
        configuratorId: null,
        switchUrl: null,
        selected: {},
    }

    init() {
        this._id = this.options.configuratorId || null
        this._loaderOwner = Symbol('configurator-loader')
        this._onSubmit = (event) => {
            event.preventDefault()
        }

        if (!this._id) {
            return
        }

        this.scope.on(this.el, 'submit', this._onSubmit)
        const session = configurators.get(this._id)
        session.options.set(this._optionMap(this.options.selected))
        session.busy.set(false)
        session.switched.set(null)
        session.focusId.set(null)
        this.scope.effect(session.busy, (busy) => {
            this.el.setAttribute('aria-busy', busy ? 'true' : 'false')
        })
        this.scope.add(session.owner.provide(this))
        window.focusHandler?.resumeFocusStatePersistent?.(FOCUS_KEY)
    }

    destroy() {
        this._removeLoader()
        if (this._id) {
            configurators.drop(this._id)
        }

        super.destroy()
    }

    switch() {
        if (!this._id || !this.options.switchUrl) {
            return
        }

        const session = configurators.get(this._id)
        const switched = session.switched.get()
        if (session.busy.get() || !switched) {
            return
        }

        session.busy.set(true)

        /** @type {Record<string, string>} */
        const params = {
            switched,
            options: JSON.stringify(session.options.get()),
        }

        void this._switchPage(session.focusId.get(), params)
    }

    /**
     * @param {string|null} focusId
     * @param {Record<string, string>} params
     */
    async _switchPage(focusId, params) {
        if (focusId && window.focusHandler?.saveFocusStatePersistent) {
            window.focusHandler.saveFocusStatePersistent(FOCUS_KEY, `[id="${focusId}"]`)
        }

        this._showLoader()

        try {
            const data = await fetchJson(urlWithParams(this.options.switchUrl, params))
            const url = data && typeof data === 'object' ? /** @type {{ url?: unknown }} */ (data).url : null
            if (typeof url === 'string' && url !== '') {
                window.location.replace(url)
                return
            }
        } catch {
            // Clear the wait state below.
        }

        this._fail()
    }

    _fail() {
        if (this._id) {
            configurators.peek(this._id)?.busy.set(false)
        }
        this._removeLoader()
    }

    _showLoader() {
        showLoader(this._loaderOwner)
    }

    _removeLoader() {
        hideLoader(this._loaderOwner)
    }

    /**
     * PHP encodes an empty map as an array. A populated map arrives as an object.
     *
     * @param {unknown} value
     * @returns {Record<string, string>}
     */
    _optionMap(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {}
        }

        /** @type {Record<string, string>} */
        const options = {}
        Object.entries(value).forEach(([groupId, optionId]) => {
            if (typeof optionId === 'string' && optionId !== '') {
                options[groupId] = optionId
            }
        })

        return options
    }
}
