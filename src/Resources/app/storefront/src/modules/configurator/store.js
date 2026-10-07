/**
 * Client sessions for product configurators.
 *
 * Group dispatches here. Product:Configurator is the only executor.
 * Sessions are keyed by configurator id so several CMS buy boxes can coexist.
 *
 * @module @views-theme/modules/configurator/store
 */

/**
 * @typedef {object} ConfiguratorExecutor
 * @property {() => void} switch
 */

/**
 * @typedef {object} ConfiguratorSnapshot
 * @property {boolean} busy
 * @property {Record<string, string>} options
 * @property {string|null} switched
 * @property {string|null} focusId
 */

/**
 * @typedef {object} ConfiguratorApplyPatch
 * @property {string} groupId
 * @property {string} optionId
 * @property {string|null} [focusId]
 */

/**
 * @typedef {object} ConfiguratorSession
 * @property {ConfiguratorExecutor|null} executor
 * @property {ConfiguratorSnapshot} snapshot
 */

/** @type {Map<string, ConfiguratorSession>} */
const sessions = new Map()

/**
 * @returns {ConfiguratorSnapshot}
 */
function blankSnapshot() {
    return {
        busy: false,
        options: {},
        switched: null,
        focusId: null,
    }
}

/**
 * @param {string} id
 * @returns {ConfiguratorSession}
 */
function session(id) {
    let current = sessions.get(id)
    if (!current) {
        current = {
            executor: null,
            snapshot: blankSnapshot(),
        }
        sessions.set(id, current)
    }

    return current
}

/**
 * @param {string} id
 * @returns {ConfiguratorSnapshot}
 */
export function getSnapshot(id) {
    return session(id).snapshot
}

/**
 * @param {string} id
 * @param {ConfiguratorExecutor} next
 */
export function attach(id, next) {
    const current = session(id)
    current.executor = next
}

/**
 * @param {string} id
 * @param {ConfiguratorExecutor} executor
 */
export function detach(id, executor) {
    const current = sessions.get(id)
    if (!current || current.executor !== executor) {
        return
    }

    current.executor = null
    current.snapshot = blankSnapshot()
}

/**
 * @param {string} id
 * @param {Partial<ConfiguratorSnapshot>} partial
 */
export function commit(id, partial) {
    const current = session(id)
    current.snapshot = {
        ...current.snapshot,
        ...partial,
    }
}

/**
 * @param {string} id
 * @param {ConfiguratorApplyPatch} patch
 */
export function apply(id, patch) {
    const current = sessions.get(id)
    if (!current?.executor || typeof current.executor.switch !== 'function') {
        return
    }

    const groupId = patch?.groupId
    const optionId = patch?.optionId
    if (!groupId || !optionId) {
        return
    }

    current.snapshot = {
        ...current.snapshot,
        options: {
            ...current.snapshot.options,
            [groupId]: optionId,
        },
        switched: groupId,
        focusId: patch.focusId || current.snapshot.focusId,
    }
    current.executor.switch()
}
