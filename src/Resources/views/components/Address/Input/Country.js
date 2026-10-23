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
export default class AddressInputCountry extends ShopwareComponent {
    static options = {
        countryDataUrl: null,
    }

    init() {
        this._fetch = { controller: null, seq: 0 }
        this._onCountryChange = this._onCountryChange.bind(this)
        this._select = this._countrySelect()
        const form = this.el.closest('form')
        const prefix = this._prefix(this._select?.name || '')
        this._state = this._control(form, this._fieldName(prefix, 'countryStateId'))
        this._zip = this._control(form, this._fieldName(prefix, 'zipcode'))
        this._vat = this._control(form, this._vatName(prefix))
        this._select?.addEventListener('change', this._onCountryChange)
        this._apply(this._select?.value || '', { preserveState: true })
    }

    destroy() {
        this._select?.removeEventListener('change', this._onCountryChange)
        abortRequest(this._fetch)
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

        setRequired(this._zip, flags.requiredZip)
        setRequired(this._vat, flags.requiredVat)

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
     * @param {string} name
     * @returns {string}
     */
    _prefix(name) {
        const match = /^(.*)\[countryId\]$/.exec(name)

        return match ? match[1] : ''
    }

    /**
     * @param {string} prefix
     * @param {string} key
     * @returns {string}
     */
    _fieldName(prefix, key) {
        return prefix !== '' ? `${prefix}[${key}]` : key
    }

    /**
     * Same name rule as Address:Input:Company.
     *
     * @param {string} prefix
     * @returns {string}
     */
    _vatName(prefix) {
        if (prefix === '' || prefix === 'billingAddress') {
            return 'vatIds[]'
        }

        return `${prefix}[vatIds][]`
    }

    /**
     * @param {HTMLFormElement|null} form
     * @param {string} name
     * @returns {HTMLInputElement|HTMLSelectElement|null}
     */
    _control(form, name) {
        if (!form || name === '') {
            return null
        }
        const el = form.elements.namedItem(name)

        return el instanceof HTMLInputElement || el instanceof HTMLSelectElement ? el : null
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
     * Form:Select root is the control's parent (label, select, feedback).
     *
     * @param {HTMLElement} field
     * @param {boolean} hidden
     */
    _setHostHidden(field, hidden) {
        const host = field.parentElement
        if (!host) {
            return
        }
        host.hidden = hidden
        host.inert = hidden
        setFieldEnabled(field, !hidden)
        this._setCountrySpan(hidden)
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
