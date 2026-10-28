/**
 * Signal stores, one instance per server-rendered id (or one singleton).
 *
 * `createStore({ index: 0, count: 0 })` wraps every value in a signal:
 * `galleries.get(id).index.get()`. Treat values as immutable (`set` a new
 * object / array). Scope keys (gallery id, form id, shell id …) are rendered by
 * Twig into `data-component-options` — never discovered through a selector.
 *
 * Pass a factory instead of an object for members that are not signals
 * (DOM refs, nested services): `createStore((id) => ({ open: createSignal(false), el: null }))`.
 *
 * @module @views-theme/modules/shared/store
 */
import { createSignal } from '@views-theme/modules/shared/signal.js'

const SINGLETON = ''

/**
 * @template {Record<string, unknown>} S
 * @typedef {{ [K in keyof S]: import('@views-theme/modules/shared/signal.js').Signal<S[K]> }} Signals
 */

/**
 * @template T
 * @typedef {object} Store
 * @property {(id?: string) => T} get  existing instance or a new one (no id → the singleton)
 * @property {(id?: string) => T|undefined} peek  existing instance only
 * @property {(id?: string) => void} drop
 */

/**
 * @template {Record<string, unknown>} S
 * @overload
 * @param {S} initial
 * @returns {Store<Signals<S>>}
 */
/**
 * @template T
 * @overload
 * @param {(id: string) => T} initial
 * @returns {Store<T>}
 */
/**
 * @param {Record<string, unknown>|((id: string) => unknown)} initial
 */
export function createStore(initial) {
    const factory = typeof initial === 'function'
        ? initial
        : () => Object.fromEntries(
            Object.entries(initial).map(([key, value]) => [key, createSignal(value)]),
        )
    /** @type {Map<string, unknown>} */
    const stores = new Map()

    return {
        get(id = SINGLETON) {
            if (!stores.has(id)) {
                stores.set(id, factory(id))
            }

            return stores.get(id)
        },
        peek: (id = SINGLETON) => stores.get(id),
        drop(id = SINGLETON) {
            stores.delete(id)
        },
    }
}
