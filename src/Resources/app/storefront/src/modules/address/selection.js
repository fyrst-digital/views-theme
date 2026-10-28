/**
 * Address manager selection: the chosen shipping / billing address id.
 *
 * The manager is a single shared shell (one mount at a time), so this is a module
 * singleton. Items claim their SSR-checked radio on init and write on click; the
 * manager mirrors the ids into its hidden `shippingAddressId` / `billingAddressId`
 * inputs. The manager resets it before a list / editor view swap and on destroy.
 *
 * @module @views-theme/modules/address/selection
 */
import { createStore } from '@views-theme/modules/shared/store.js'

/**
 * @typedef {{ shipping: string|null, billing: string|null }} AddressSelection
 */

/** @returns {AddressSelection} */
const blank = () => ({ shipping: null, billing: null })

export const { selection } = createStore({ selection: blank() }).get()

/**
 * @param {'shipping'|'billing'} type
 * @param {string|null} id
 */
export function selectAddress(type, id) {
    if (!id || (type !== 'shipping' && type !== 'billing')) {
        return
    }

    const current = selection.get()
    if (current[type] === id) {
        return
    }

    selection.set({ ...current, [type]: id })
}

export function resetSelection() {
    selection.set(blank())
}
