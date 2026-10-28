/**
 * Client sessions for product configurators, keyed by `configuratorId` so several
 * CMS buy boxes can coexist.
 *
 * Group writes a selection through `apply` (updates `options`, then asks the
 * session's `owner` to `switch`). Product:Configurator is the only executor: it
 * provides itself as `owner` and reports `busy`.
 *
 * @module @views-theme/modules/configurator/store
 */
import { createService } from '@views-theme/modules/shared/service.js'
import { createSignal } from '@views-theme/modules/shared/signal.js'
import { createStore } from '@views-theme/modules/shared/store.js'

/**
 * @typedef {object} ConfiguratorApplyPatch
 * @property {string} groupId
 * @property {string} optionId
 * @property {string|null} [focusId]
 */

export const configurators = createStore(() => ({
    /** Selected option per group id. */
    options: createSignal(/** @type {Record<string, string>} */ ({})),
    busy: createSignal(false),
    /** Group id the user just changed. */
    switched: createSignal(/** @type {string|null} */ (null)),
    focusId: createSignal(/** @type {string|null} */ (null)),
    /** The mounted Product:Configurator (executor): `switch`. */
    owner: createService(),
}))

/**
 * @param {string} id
 * @param {ConfiguratorApplyPatch} patch
 */
export function apply(id, patch) {
    const groupId = patch?.groupId
    const optionId = patch?.optionId
    if (!id || !groupId || !optionId) {
        return
    }

    const session = configurators.get(id)
    session.options.set({ ...session.options.get(), [groupId]: optionId })
    session.switched.set(groupId)
    session.focusId.set(patch.focusId || session.focusId.get())
    session.owner.call('switch')
}
