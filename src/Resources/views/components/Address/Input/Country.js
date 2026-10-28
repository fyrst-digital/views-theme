import {
    abortRequest,
    beginRequest,
    fetchJson,
    urlWithParams,
} from '@views-theme/modules/shared/http.js'
import { countryRules } from '@views-theme/modules/address/country.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Country change — executor of the address country rules: loads the states and
 * publishes required zip / VAT / state to the fields of the same `scope`.
 *
 * @extends {ThemeComponent}
 */
export default class AddressInputCountry extends ThemeComponent {
    static options = {
        countryDataUrl: null,
        scope: '',
    }

    init() {
        this._fetch = { controller: null, seq: 0 }
        this._onCountryChange = this._onCountryChange.bind(this)
        this._select = this._countrySelect()
        this._rules = countryRules.get(this.options.scope)
        // The state field hides itself; this host only re-spans the grid cell.
        this.scope.effect(this._rules.states, (states) => {
            if (states) {
                this._setCountrySpan(!states.visible)
            }
        })
        this.scope.on(this._select, 'change', this._onCountryChange)
        this._apply(this._select?.value || '', { preserveState: true })
    }

    destroy() {
        abortRequest(this._fetch)
        this._rules.flags.set(null)
        this._rules.states.set(null)

        super.destroy()
    }

    /**
     * @param {Event} event
     */
    _onCountryChange(event) {
        if (event.target !== this._select) {
            return
        }
        this._apply(this._select.value, { preserveState: false })
    }

    /**
     * @param {string} countryId
     * @param {{ preserveState?: boolean }} [options]
     */
    _apply(countryId, { preserveState = false } = {}) {
        const flags = this._flags()

        this._rules.flags.set({ requiredZip: flags.requiredZip, requiredVat: flags.requiredVat })

        if (!countryId || !this.options.countryDataUrl) {
            this._setStateOptions([], flags, preserveState)
            return
        }

        const { signal, isCurrent } = beginRequest(this._fetch)
        fetchJson(urlWithParams(this.options.countryDataUrl, { countryId }), { signal })
            .then((payload) => {
                if (!isCurrent()) {
                    return
                }
                const states = this._normalizeStates(payload?.states)
                this._setStateOptions(states, flags, preserveState)
            })
            .catch(() => {
                if (!isCurrent()) {
                    return
                }
                this._setStateOptions([], flags, preserveState)
            })
    }

    /**
     * @returns {{ requiredZip: boolean, requiredState: boolean, requiredVat: boolean, displayState: boolean }}
     */
    _flags() {
        const option = this._select?.selectedOptions?.[0]

        return {
            requiredZip: option?.dataset.zipRequired === 'true',
            requiredState: option?.dataset.stateRequired === 'true',
            requiredVat: option?.dataset.vatRequired === 'true',
            displayState: option?.dataset.stateDisplayed === 'true',
        }
    }

    /**
     * @returns {HTMLSelectElement|null}
     */
    _countrySelect() {
        const select = [...this.el.querySelectorAll('select')].find((el) => (
            el instanceof HTMLSelectElement
            && (el.name === 'countryId' || el.name.endsWith('[countryId]'))
        ))

        return select instanceof HTMLSelectElement ? select : null
    }

    /**
     * @param {unknown} states
     * @returns {{ value: string, label: string }[]}
     */
    _normalizeStates(states) {
        const raw = states && typeof states === 'object' && Array.isArray(states.elements)
            ? states.elements
            : states
        const list = Array.isArray(raw) ? raw : Object.values(raw || {})

        return list.map((state) => {
            if (!state || typeof state !== 'object') {
                return null
            }
            const value = String(state.id || '')
            const label = String(state.translated?.name || state.name || value)

            return value ? { value, label } : null
        }).filter(Boolean)
    }

    /**
     * @param {{ value: string, label: string }[]} states
     * @param {{ requiredState?: boolean, displayState?: boolean }} flags
     * @param {boolean} preserveState
     */
    _setStateOptions(states, flags, preserveState) {
        const visible = !!flags.displayState && states.length > 0

        this._rules.states.set({
            options: states,
            visible,
            required: visible && !!flags.requiredState,
            preserve: preserveState,
        })
    }

    /**
     * One span class: full row when the state cell is hidden, half when it is shown.
     *
     * @param {boolean} stateHidden
     */
    _setCountrySpan(stateHidden) {
        const countryHost = this._select?.parentElement
        if (!countryHost) {
            return
        }
        countryHost.classList.toggle('g-col-md-6', stateHidden)
        countryHost.classList.toggle('g-col-md-3', !stateHidden)
    }
}
