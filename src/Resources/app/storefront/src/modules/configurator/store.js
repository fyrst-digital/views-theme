/**
 * Client sessions for product configurators.
 *
 * Option and Select dispatch here. Product:Configurator is the only executor.
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
 * @property {boolean} attached
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
 * @property {Set<(snapshot: ConfiguratorSnapshot) => void>} listeners
 */

/** @type {Map<string, ConfiguratorSession>} */
const sessions = new Map()

/**
 * @returns {ConfiguratorSnapshot}
 */
function blankSnapshot() {
    return {
        attached: false,
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
            listeners: new Set(),
        }
        sessions.set(id, current)
    }

    return current
}

/**
 * @param {ConfiguratorSession} current
 */
function publish(current) {
    const snapshot = current.snapshot
    current.listeners.forEach((fn) => {
        fn(snapshot)
    })
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
 * @param {(snapshot: ConfiguratorSnapshot) => void} fn
 * @returns {() => void}
 */
export function subscribe(id, fn) {
    const current = session(id)
    current.listeners.add(fn)
    fn(current.snapshot)

    return () => {
        current.listeners.delete(fn)
    }
}

/**
 * @param {string} id
 * @param {ConfiguratorExecutor} next
 */
export function attach(id, next) {
    const current = session(id)
    current.executor = next
    current.snapshot = { ...current.snapshot, attached: true }
    publish(current)
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
    publish(current)
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
        attached: current.executor !== null,
    }
    publish(current)
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
        attached: true,
    }
    publish(current)
    current.executor.switch()
}
