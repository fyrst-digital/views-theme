/**
 * One disposer for everything a component sets up: DOM listeners, event-bus
 * subscriptions, signal effects and custom cleanup. Built on `AbortController`.
 *
 * Every method is a closure, so `const { on } = scope` works. `on` ignores a nullish target (like `?.addEventListener`).
 *
 * @module @views-theme/modules/shared/scope
 */
import { effect } from '@views-theme/modules/shared/signal.js'

/**
 * @typedef {object} Scope
 * @property {AbortSignal} signal  aborts on dispose (pass to `fetch`, `AbortSignal.any`, …)
 * @property {(target: EventTarget|null|undefined, type: string, listener: EventListener, options?: boolean|AddEventListenerOptions) => void} on
 * @property {(name: string, listener: (payload: any) => void) => void} bus  `Shopware.on` / `off` pair
 * @property {(source: import('@views-theme/modules/shared/signal.js').Signal<any>|import('@views-theme/modules/shared/signal.js').Signal<any>[], fn: (...values: any[]) => void) => () => void} effect
 * @property {<T>(source: import('@views-theme/modules/shared/signal.js').Signal<T>, fn: (value: T) => void) => () => void} watch  subscribe without replay
 * @property {<F extends (() => void)|null|undefined>(cleanup: F) => F} add  run on dispose (runs now when already disposed; nullish is ignored)
 * @property {() => void} dispose  idempotent
 */

/**
 * @returns {Scope}
 */
export function createScope() {
    const controller = new AbortController()
    const { signal } = controller
    /** @type {Array<() => void>} */
    const cleanups = []

    return {
        signal,
        on(target, type, listener, options) {
            if (!target) {
                return
            }

            const base = typeof options === 'object' && options !== null ? options : { capture: Boolean(options) }
            target.addEventListener(type, listener, { ...base, signal })
        },
        bus(name, listener) {
            window.Shopware.on(name, listener)
            this.add(() => window.Shopware.off(name, listener))
        },
        effect: (source, fn) => effect(source, fn, { signal }),
        watch: (source, fn) => source.subscribe(fn, { signal }),
        add(cleanup) {
            if (!cleanup) {
                return cleanup
            }

            if (signal.aborted) {
                cleanup()
            } else {
                cleanups.push(cleanup)
            }

            return cleanup
        },
        dispose() {
            if (signal.aborted) {
                return
            }

            controller.abort()
            for (const cleanup of cleanups.splice(0).reverse()) {
                try {
                    cleanup()
                } catch (error) {
                    console.error('scope cleanup failed', error)
                }
            }
        },
    }
}
