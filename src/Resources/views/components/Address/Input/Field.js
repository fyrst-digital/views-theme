import ThemeComponent from '@views-theme/modules/theme-component.js'

import { countryRules } from '@views-theme/modules/address/country.js'
import { setFieldEnabled, setRequired } from '@views-theme/modules/shared/form.js'

/**
 * Address field that follows the country rules of its form prefix (`scope`):
 * `zip` and `vat` toggle required, `state` renders the state options and hides itself.
 *
 * @extends {ThemeComponent}
 */
export default class AddressInputField extends ThemeComponent {
    static options = {
        scope: '',
        field: 'zip',
    }

    init() {
        this._control = this.el.querySelector('input, select')
        const rules = countryRules.get(this.options.scope)

        if (this.options.field === 'state') {
            this.scope.effect(rules.states, (states) => this._applyStates(states))
            return
        }

        const key = this.options.field === 'vat' ? 'requiredVat' : 'requiredZip'
        this.scope.effect(rules.flags, (flags) => {
            if (flags) {
                setRequired(this._control, flags[key])
            }
        })
    }

    /**
     * @param {import('@views-theme/modules/address/country.js').CountryStates|null} states
     */
    _applyStates(states) {
        const select = this._control
        if (!states || !(select instanceof HTMLSelectElement)) {
            return
        }

        const selected = states.preserve ? select.value : ''
        const placeholder = select.querySelector('option[value=""]') || this._placeholder()

        select.replaceChildren(placeholder)
        if (states.visible) {
            states.options.forEach((state) => {
                const option = document.createElement('option')
                option.value = state.value
                option.textContent = state.label
                option.selected = state.value === selected
                select.append(option)
            })
        }

        setRequired(select, states.visible && states.required)
        this.el.hidden = !states.visible
        this.el.inert = !states.visible
        setFieldEnabled(select, states.visible)
    }

    /**
     * @returns {HTMLOptionElement}
     */
    _placeholder() {
        const option = document.createElement('option')
        option.value = ''
        option.textContent = ''

        return option
    }
}
