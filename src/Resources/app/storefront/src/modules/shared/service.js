/**
 * "Call the one mounted owner." The owner `provide`s itself; callers `call` a
 * method by name and nothing happens while nobody provides.
 *
 * Replaces attach/detach executors, request-signal intents and name-broadcast
 * `callMethod` where a single owner exists.
 *
 * @module @views-theme/modules/shared/service
 */
import { createSignal } from '@views-theme/modules/shared/signal.js'

/**
 * @template [T=Record<string, any>]
 * @typedef {object} Service
 * @property {import('@views-theme/modules/shared/signal.js').Signal<T|null>} api  the current provider
 * @property {import('@views-theme/modules/shared/signal.js').Signal<boolean>} ready  a provider is mounted
 * @property {(impl: T) => () => void} provide  last provider wins; the returned dispose is a no-op once replaced
 * @property {(method: string, ...args: any[]) => any} call  `undefined` when there is no provider or no such method
 * @property {(timeout?: number) => Promise<T|null>} whenReady  resolves `null` when nothing provided in time
 */

/**
 * @template [T=Record<string, any>]
 * @returns {Service<T>}
 */
export function createService() {
    /** @type {import('@views-theme/modules/shared/signal.js').Signal<T|null>} */
    const api = createSignal(null)
    const ready = createSignal(false)

    return {
        api,
        ready,
        provide(impl) {
            api.set(impl)
            ready.set(true)

            return () => {
                if (api.get() !== impl) {
                    return
                }

                api.set(null)
                ready.set(false)
            }
        },
        call(method, ...args) {
            const impl = api.get()

            return typeof impl?.[method] === 'function' ? impl[method](...args) : undefined
        },
        whenReady(timeout = 2000) {
            const current = api.get()
            if (current) {
                return Promise.resolve(current)
            }

            const { promise, resolve } = Promise.withResolvers()
            const expired = AbortSignal.timeout(timeout)
            const stop = api.subscribe((impl) => {
                if (impl) {
                    resolve(impl)
                }
            }, { signal: expired })
            expired.addEventListener('abort', () => resolve(null), { once: true })

            return promise.finally(stop)
        },
    }
}
