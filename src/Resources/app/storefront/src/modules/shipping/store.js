/**
 * Shipping calculation store (country / payment method / shipping method).
 *
 * Fields write here; `Cart` is the only executor and subscribes to `request`.
 * One store per page, so a cart page and an open drawer stay in sync.
 *
 * @module @views-theme/modules/shipping/store
 */
import { createSignal } from '@views-theme/modules/shared/signal.js'

/**
 * @typedef {Record<string, string>} ShippingValues
 */

/**
 * @typedef {object} ShippingRequest
 * @property {number} seq
 * @property {ShippingValues} values
 * @property {Element|null} source
 */

/** Current value per connected field. */
export const values = createSignal(/** @type {ShippingValues} */ ({}))

/** Set only by `select` (user intent), never by `connect`. */
export const request = createSignal(/** @type {ShippingRequest|null} */ (null))

/** @type {Map<string, number>} */
const connections = new Map()
let seq = 0

/**
 * Register a mounted field with its server-rendered value.
 *
 * @param {string} name
 * @param {string} value
 * @returns {() => void} disconnect; the value is dropped with the last field of that name
 */
export function connect(name, value) {
    connections.set(name, (connections.get(name) || 0) + 1)
    values.set({ ...values.get(), [name]: value })

    return () => {
        const count = (connections.get(name) || 0) - 1
        if (count > 0) {
            connections.set(name, count)
            return
        }

        connections.delete(name)
        const { [name]: _removed, ...rest } = values.get()
        values.set(rest)
    }
}

/**
 * User picked a value: update the store and ask the executor to apply it.
 *
 * @param {string} name
 * @param {string} value
 * @param {Element|null} [source]
 */
export function select(name, value, source = null) {
    const next = { ...values.get(), [name]: value }
    values.set(next)
    request.set({ seq: ++seq, values: next, source })
}
