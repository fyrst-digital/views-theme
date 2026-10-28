/**
 * Address country rules, keyed by the form prefix rendered by Twig (`billingAddress`,
 * `shippingAddress`, `address` …).
 *
 * `Address:Input:Country` is the only executor: it derives the rules from the
 * selected country option and publishes them. Zip, VAT and state fields
 * (`Address:Input:Field`) apply them to themselves. Nothing looks fields up by
 * computed `name`.
 *
 * @module @views-theme/modules/address/country
 */
import { createStore } from '@views-theme/modules/shared/store.js'

/**
 * @typedef {{ requiredZip: boolean, requiredVat: boolean }} CountryFlags
 * @typedef {{ options: { value: string, label: string }[], visible: boolean, required: boolean, preserve: boolean }} CountryStates
 */

/**
 * `flags` is `null` until the Country field applied its first selection; `states`
 * is a fresh object per country change (the state list is reloaded).
 */
export const countryRules = createStore({
    flags: /** @type {CountryFlags|null} */ (null),
    states: /** @type {CountryStates|null} */ (null),
})
