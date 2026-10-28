/**
 * Self-registering controls: `connect` in `init`, call the returned disconnect
 * on teardown (`scope.add(registry.connect(this))`). Nothing scans the DOM.
 *
 * Items sharing an identity (`identify`) form a stack and the **last connected**
 * one is active; when it disconnects the previous one takes over again
 * (bar facet vs. the same facet in the drawer, top vs. bottom pagination).
 * Without `identify` every item is its own identity.
 *
 * @module @views-theme/modules/shared/registry
 */
import { createSignal } from '@views-theme/modules/shared/signal.js'

/**
 * @template T
 * @typedef {object} Registry
 * @property {(item: T) => () => void} connect  returns disconnect
 * @property {() => T[]} all  every connected item
 * @property {() => T[]} active  last connected item per identity
 * @property {import('@views-theme/modules/shared/signal.js').Signal<number>} version  bumped (microtask-batched) on connect / disconnect
 */

/**
 * @template T
 * @param {{ identify?: (item: T) => string|symbol }} [options]
 * @returns {Registry<T>}
 */
export function createRegistry({ identify = () => Symbol('item') } = {}) {
    /** @type {Map<string|symbol, T[]>} */
    const stacks = new Map()
    const version = createSignal(0)
    let queued = false

    const notify = () => {
        if (queued) {
            return
        }

        queued = true
        queueMicrotask(() => {
            queued = false
            version.update((n) => n + 1)
        })
    }

    return {
        version,
        connect(item) {
            const id = identify(item)
            const stack = stacks.get(id) ?? []
            stack.push(item)
            stacks.set(id, stack)
            notify()

            return () => {
                const current = stacks.get(id)
                const at = current ? current.indexOf(item) : -1
                if (!current || at === -1) {
                    return
                }

                current.splice(at, 1)
                if (!current.length) {
                    stacks.delete(id)
                }
                notify()
            }
        },
        all: () => [...stacks.values()].flat(),
        active: () => [...stacks.values()].map((stack) => stack.at(-1)),
    }
}
