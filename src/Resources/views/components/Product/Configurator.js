import { attach, commit, detach, getSnapshot } from '@views-theme/modules/configurator/store.js'
import { fetchJson, urlWithParams } from '@views-theme/modules/shared/http.js'

const FOCUS_KEY = 'variant-switch'

/**
 * Product configurator owner. Reads the store snapshot and calls the Shopware switch API.
 *
 * @extends {ShopwareComponent}
 */
export default class ProductConfigurator extends ShopwareComponent {
    static options = {
        configuratorId: null,
        switchUrl: null,
        selected: {},
    }

    init() {
        this._id = this.options.configuratorId || null
        /** @type {Element|null} */
        this._loaderEl = null
        this._onSubmit = (event) => {
            event.preventDefault()
        }

        if (!this._id) {
            return
        }

        this.el.addEventListener('submit', this._onSubmit)
        attach(this._id, this)
        commit(this._id, {
            options: this._optionMap(this.options.selected),
            busy: false,
            switched: null,
            focusId: null,
        })
        this.el.setAttribute('aria-busy', 'false')
        window.focusHandler?.resumeFocusStatePersistent?.(FOCUS_KEY)
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
        this._removeLoader()
        if (this._id) {
            detach(this._id, this)
        }
    }

    switch() {
        if (!this._id || !this.options.switchUrl) {
            return
        }

        const snapshot = getSnapshot(this._id)
        if (snapshot.busy || !snapshot.switched) {
            return
        }

        commit(this._id, { busy: true })
        this.el.setAttribute('aria-busy', 'true')

        /** @type {Record<string, string>} */
        const params = {
            switched: snapshot.switched,
            options: JSON.stringify(snapshot.options || {}),
        }

        void this._switchPage(snapshot.focusId, params)
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
            commit(this._id, { busy: false })
        }
        if (this.el?.isConnected) {
            this.el.setAttribute('aria-busy', 'false')
        }
        this._removeLoader()
    }

    _showLoader() {
        if (this._loaderEl || document.querySelector('.modal-backdrop')) {
            return
        }

        document.documentElement.classList.add('no-scroll')
        document.body.insertAdjacentHTML(
            'beforeend',
            '<div class="modal-backdrop modal-backdrop-open"><div class="loader" role="status"><span class="visually-hidden">Loading...</span></div></div>',
        )
        this._loaderEl = document.body.lastElementChild
    }

    _removeLoader() {
        if (!this._loaderEl) {
            return
        }

        this._loaderEl.remove()
        this._loaderEl = null
        document.documentElement.classList.remove('no-scroll')
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
