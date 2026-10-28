/**
 * Minimal reactive value.
 *
 * `subscribe` does not replay the current value; it only notifies on change.
 *
 * @module @views-theme/modules/shared/signal
 */

/**
 * @template T
 * @typedef {object} Signal
 * @property {() => T} get
 * @property {(next: T) => void} set  no-op when `Object.is(next, current)`
 * @property {(listener: (value: T) => void) => () => void} subscribe  returns unsubscribe
 */

/**
 * @template T
 * @param {T} initial
 * @returns {Signal<T>}
 */
export function createSignal(initial) {
    let current = initial
    /** @type {Set<(value: T) => void>} */
    const listeners = new Set()

    return {
        get: () => current,
        set(next) {
            if (Object.is(next, current)) {
                return
            }

            current = next
            for (const listener of [...listeners]) {
                listener(current)
            }
        },
        subscribe(listener) {
            listeners.add(listener)

            return () => {
                listeners.delete(listener)
            }
        },
    }
}
