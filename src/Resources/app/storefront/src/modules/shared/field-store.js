/**
 * Field store: mounted fields publish values, one executor applies them.
 *
 * Fields never find each other or the executor in the DOM. They `connect` with
 * their server-rendered value, call `select` on user input, and mirror
 * `values`. The executor subscribes to `request`.
 *
 * @module @views-theme/modules/shared/field-store
 */
import { createSignal } from '@views-theme/modules/shared/signal.js'

/**
 * @typedef {Record<string, string>} FieldValues
 */

/**
 * @typedef {object} FieldRequest
 * @property {number} seq
 * @property {FieldValues} values
 * @property {Element|null} source
 */

/**
 * @typedef {object} FieldStore
 * @property {import('@views-theme/modules/shared/signal.js').Signal<FieldValues>} values  current value per connected field
 * @property {import('@views-theme/modules/shared/signal.js').Signal<FieldRequest|null>} request  set only by `select` (user intent)
 * @property {(name: string, value: string) => () => void} connect  register a mounted field; returns disconnect
 * @property {(name: string, value: string, source?: Element|null) => void} select  user changed a field
 */

/**
 * @returns {FieldStore}
 */
export function createFieldStore() {
    const values = createSignal(/** @type {FieldValues} */ ({}))
    const request = createSignal(/** @type {FieldRequest|null} */ (null))
    /** @type {Map<string, number>} */
    const connections = new Map()
    let seq = 0

    return {
        values,
        request,

        /**
         * The value is dropped with the last connected field of that name, so
         * a field that disappears is no longer sent.
         */
        connect(name, value) {
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
        },

        select(name, value, source = null) {
            const next = { ...values.get(), [name]: value }
            values.set(next)
            request.set({ seq: ++seq, values: next, source })
        },
    }
}
