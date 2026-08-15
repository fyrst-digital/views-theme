import {
    abortRequest,
    beginRequest,
    fetchJson,
    urlWithParams,
} from '@views-theme/modules/shared/http.js'
import { setFieldEnabled, setRequired } from '@views-theme/modules/shared/form.js'

/**
 * Country change — load states, set zip / VAT / state required.
 *
 * @extends {ShopwareComponent}
 */
export default class AddressCountryState extends ShopwareComponent {
    static options = {
        countryDataUrl: null,
        countries: {},
        countrySelectId: null,
        stateSelectId: null,
        zipInputId: null,
        vatInputId: null,
    }

    init() {
        this._fetch = { controller: null, seq: 0 }
        this._onCountryChange = this._onCountryChange.bind(this)
        this._country = this._byId(this.options.countrySelectId)
        this._state = this._byId(this.options.stateSelectId)
        this._zip = this._byId(this.options.zipInputId)
        this._vat = this._byId(this.options.vatInputId)
        this._country?.addEventListener('change', this._onCountryChange)
        this._apply(this._country?.value || '', { preserveState: true })
    }

    destroy() {
        this._country?.removeEventListener('change', this._onCountryChange)
        abortRequest(this._fetch)
    }

    /**
     * @param {Event} event
     */
    _onCountryChange(event) {
        if (event.target !== this._country) {
            return
        }
        this._apply(this._country.value, { preserveState: false })
    }

    /**
     * @param {string} countryId
     * @param {{ preserveState?: boolean }} [options]
     */
    _apply(countryId, { preserveState = false } = {}) {
        const flags = this.options.countries?.[countryId] || {
            requiredZip: false,
            requiredState: false,
            requiredVat: false,
            displayState: false,
        }

        setRequired(this._zip, !!flags.requiredZip)
        setRequired(this._vat, !!flags.requiredVat)

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
        const select = this._state
        if (!select) {
            return
        }

        const visible = !!flags.displayState && states.length > 0
        const selected = preserveState ? select.value : ''
        const placeholder = select.querySelector('option[value=""]') || this._placeholderOption()

        select.replaceChildren(placeholder)
        if (visible) {
            states.forEach((state) => {
                const option = document.createElement('option')
                option.value = state.value
                option.textContent = state.label
                if (state.value === selected) {
                    option.selected = true
                }
                select.append(option)
            })
        }

        setRequired(select, visible && !!flags.requiredState)
        this._setHostHidden(select, !visible)
    }

    /**
     * @returns {HTMLOptionElement}
     */
    _placeholderOption() {
        const option = document.createElement('option')
        option.value = ''
        option.textContent = ''
        return option
    }

    /**
     * @param {HTMLElement} field
     * @param {boolean} hidden
     */
    _setHostHidden(field, hidden) {
        const host = field.closest('[data-country-state-host]')
        if (!host) {
            return
        }
        host.hidden = hidden
        host.inert = hidden
        setFieldEnabled(field, !hidden)
    }

    /**
     * @param {string|null} id
     * @returns {HTMLInputElement|HTMLSelectElement|null}
     */
    _byId(id) {
        if (!id) {
            return null
        }
        const el = this.el.querySelector(`#${CSS.escape(id)}`)
        return el instanceof HTMLInputElement || el instanceof HTMLSelectElement ? el : null
    }
}
