/**
 * Registry of lazy-mounted shells (Drawer, Modal, Search Overlay, Gallery
 * Fullscreen …), keyed by the shell root's server-rendered `id`.
 *
 * A shell registers itself in `init` (`scope.add(registerShell(id, this, el))`).
 * An Action never queries the DOM for it: it reads `shell(id)` — `api` (the
 * mounted shell, a `createService` provider) and `open` (state) — and awaits
 * `whenShellReady(id)` after mounting HTML.
 *
 * @module @views-theme/modules/shared/shell-registry
 */
import { createService } from '@views-theme/modules/shared/service.js'
import { createSignal } from '@views-theme/modules/shared/signal.js'
import { createStore } from '@views-theme/modules/shared/store.js'

/**
 * @typedef {object} ShellApi
 * @property {() => void} [open]
 * @property {() => void} [close]
 * @property {() => boolean} [isOpen]
 */

/**
 * @typedef {object} ShellEntry
 * @property {import('@views-theme/modules/shared/service.js').Service<ShellApi>} service
 * @property {import('@views-theme/modules/shared/signal.js').Signal<ShellApi|null>} api  the mounted shell (`service.api`)
 * @property {import('@views-theme/modules/shared/signal.js').Signal<boolean>} open
 * @property {Element|null} el  the shell component's root
 * @property {Element|null} mount  root appended by `mountShell` (a wrapper around `el`, or `el` itself)
 * @property {Record<string, unknown>|null} detail  payload of the last `setShellOpen` (e.g. the search term on close)
 * @property {(() => void)|null} revoke  drops the current provider
 */

const shells = createStore(() => {
    const service = createService()

    return /** @type {ShellEntry} */ ({
        service,
        api: service.api,
        open: createSignal(false),
        el: null,
        mount: null,
        detail: null,
        revoke: null,
    })
})

/**
 * @param {string} id
 * @returns {ShellEntry}
 */
export function shell(id) {
    return shells.get(id)
}

/**
 * Called by the shell component in `init`.
 *
 * @param {string} id
 * @param {ShellApi} api
 * @param {Element} el
 * @returns {() => void} unregister (no-op when a newer mount already took the id)
 */
export function registerShell(id, api, el) {
    const entry = shells.get(id)
    entry.el = el
    const revoke = entry.service.provide(api)
    entry.revoke = revoke

    return () => {
        if (entry.api.get() !== api) {
            return
        }

        entry.el = null
        entry.open.set(false)
        revoke()
    }
}

/**
 * Called by the shell component when it finishes opening / closing.
 * `detail` is readable from `shell(id).detail` inside `open` subscribers.
 *
 * @param {string} id
 * @param {boolean} open
 * @param {Record<string, unknown>|null} [detail]
 */
export function setShellOpen(id, open, detail = null) {
    const entry = shells.peek(id)
    if (entry) {
        entry.detail = detail
        entry.open.set(open)
    }
}

/**
 * Forget the current mount synchronously, so a replacement mount cannot be
 * confused with the stale one while the old component is still being destroyed.
 *
 * @param {string} id
 */
export function releaseShell(id) {
    const entry = shells.peek(id)
    if (!entry) {
        return
    }

    entry.mount?.remove()
    entry.el?.remove()
    entry.mount = null
    entry.el = null
    entry.open.set(false)
    entry.revoke?.()
    entry.revoke = null
}

/**
 * @param {string} id
 * @param {number} [timeout] ms
 * @returns {Promise<ShellApi|null>} null when nothing registered in time
 */
export function whenShellReady(id, timeout = 2000) {
    return shells.get(id).service.whenReady(timeout)
}
