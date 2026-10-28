/**
 * Minimal reactive value.
 *
 * `subscribe` does not replay the current value; it only notifies on change.
 * Pass `{ signal }` (an `AbortSignal`, usually `scope.signal`) to unsubscribe
 * automatically when it aborts.
 *
 * @module @views-theme/modules/shared/signal
 */

/**
 * @typedef {object} SubscribeOptions
 * @property {AbortSignal} [signal]
 */

/**
 * @template T
 * @typedef {object} Signal
 * @property {() => T} get
 * @property {(next: T) => void} set  no-op when `Object.is(next, current)`
 * @property {(update: (current: T) => T) => void} update
 * @property {(listener: (value: T) => void, options?: SubscribeOptions) => () => void} subscribe  returns unsubscribe
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

    /** @type {Signal<T>} */
    const self = {
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
        update: (update) => self.set(update(current)),
        subscribe(listener, { signal } = {}) {
            if (signal?.aborted) {
                return () => {}
            }

            listeners.add(listener)
            const stop = () => {
                listeners.delete(listener)
                signal?.removeEventListener('abort', stop)
            }
            signal?.addEventListener('abort', stop, { once: true })

            return stop
        },
    }

    return self
}

/**
 * Run `fn` with the current value now, then on every change.
 * Use this instead of `subscribe` when a late subscriber must see the current state.
 *
 * With an array of signals, `fn` receives every current value and runs once per change
 * of any of them.
 *
 * @template T
 * @param {Signal<T>|Signal<any>[]} source
 * @param {(...values: any[]) => void} fn
 * @param {SubscribeOptions} [options]
 * @returns {() => void} stop
 */
export function effect(source, fn, options = {}) {
    if (options.signal?.aborted) {
        return () => {}
    }

    if (!Array.isArray(source)) {
        fn(source.get())

        return source.subscribe(fn, options)
    }

    const run = () => fn(...source.map((item) => item.get()))
    run()
    const stops = source.map((item) => item.subscribe(run, options))

    return () => stops.forEach((stop) => stop())
}
