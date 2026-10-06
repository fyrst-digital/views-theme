/**
 * Client session for the page product listing.
 *
 * Controls dispatch and subscribe here. Product:Listing is the only executor.
 *
 * @module @views-theme/modules/listing/store
 */

/**
 * @typedef {object} ListingExecutor
 * @property {(patch?: Record<string, unknown>, options?: { pushHistory?: boolean, resetPage?: boolean }) => void} apply
 * @property {(id: string) => void} reset
 * @property {(keys?: string|string[]|null) => void} resetFilters
 * @property {() => void} syncControls
 * @property {(params?: Record<string, unknown>|null, options?: { built?: boolean }) => Promise<void>} [syncFilterOptions]
 */

/**
 * @typedef {object} ListingSnapshot
 * @property {boolean} attached
 * @property {boolean} busy
 * @property {Record<string, unknown>} params
 * @property {import('@views-theme/modules/types.js').ListingLabel[]} labels
 */

/** @type {ListingExecutor|null} */
let executor = null

/** @type {ListingSnapshot} */
let snapshot = {
    attached: false,
    busy: false,
    params: {},
    labels: [],
}

/** @type {Set<(snapshot: ListingSnapshot) => void>} */
const listeners = new Set()

function publish() {
    const current = snapshot
    listeners.forEach((fn) => {
        fn(current)
    })
}

/**
 * @returns {ListingSnapshot}
 */
export function getSnapshot() {
    return snapshot
}

/**
 * @param {(snapshot: ListingSnapshot) => void} fn
 * @returns {() => void}
 */
export function subscribe(fn) {
    listeners.add(fn)
    fn(snapshot)
    return () => {
        listeners.delete(fn)
    }
}

/**
 * @param {ListingExecutor} next
 */
export function attach(next) {
    executor = next
    snapshot = { ...snapshot, attached: true }
    publish()
}

/**
 * @param {ListingExecutor} current
 */
export function detach(current) {
    if (executor !== current) {
        return
    }

    executor = null
    snapshot = {
        attached: false,
        busy: false,
        params: {},
        labels: [],
    }
    publish()
}

/**
 * @param {Partial<ListingSnapshot>} partial
 */
export function commit(partial) {
    snapshot = {
        ...snapshot,
        ...partial,
        attached: executor !== null,
    }
    publish()
}

/**
 * @param {Record<string, unknown>} [patch]
 * @param {{ pushHistory?: boolean, resetPage?: boolean }} [callOptions]
 */
export function apply(patch = {}, callOptions = {}) {
    if (!executor) {
        return
    }

    const options = {
        resetPage: false,
        ...(callOptions || {}),
    }

    executor.apply({ p: 1, ...patch }, options)
}

/**
 * @param {string|string[]|null} [keys]
 */
export function resetFilters(keys = null) {
    executor?.resetFilters(keys ?? null)
}

/**
 * @param {string} id
 */
export function resetOption(id) {
    if (id === undefined || id === null || id === '') {
        return
    }

    executor?.reset(id)
}

export function syncControls() {
    executor?.syncControls()
}

/**
 * @returns {Promise<void>}
 */
export function syncFilterOptions() {
    if (!executor || typeof executor.syncFilterOptions !== 'function') {
        return Promise.resolve()
    }

    return executor.syncFilterOptions()
}
