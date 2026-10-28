/**
 * Listing facade for controls (filters, Pagination, Sorting, Reset, Active chips,
 * filter drawer, Panel, Group).
 *
 * Controls read the signals (`busy`, `labels`, `liveText`, …), `connectControl`
 * themselves in `init` (`scope.add(connectControl(this))`), and dispatch `apply` /
 * `resetFilters` / `resetOption`. Product:Listing is the only executor
 * (`scope.add(attach(this))`); every dispatch no-ops while none is mounted.
 *
 * @module @views-theme/modules/listing/store
 */
import { connect } from '@views-theme/modules/listing/controls.js'
import { attached, busy, labels, listing, liveText, params } from '@views-theme/modules/listing/state.js'

export { attached, busy, labels, liveText, params }

/**
 * Register a control (MultiSelect, Boolean, Range, Rating, Sorting, Pagination)
 * with the listing.
 *
 * @param {import('@views-theme/modules/types.js').ListingControl} control
 * @returns {() => void} disconnect
 */
export function connectControl(control) {
    return connect(control)
}

/**
 * Make `owner` the executor (`apply`, `reset`, `resetFilters`). The returned
 * dispose resets the listing signals.
 *
 * @param {object} owner
 * @returns {() => void}
 */
export function attach(owner) {
    const dispose = listing.provide(owner)

    return () => {
        if (listing.api.get() !== owner) {
            return
        }

        dispose()
        busy.set(false)
        params.set({})
        labels.set([])
    }
}

/**
 * @param {Record<string, unknown>} [patch]
 * @param {{ pushHistory?: boolean, resetPage?: boolean }} [callOptions]
 */
export function apply(patch = {}, callOptions = {}) {
    listing.call('apply', { p: 1, ...patch }, { resetPage: false, ...callOptions })
}

/**
 * @param {string|string[]|null} [keys]
 */
export function resetFilters(keys = null) {
    listing.call('resetFilters', keys ?? null)
}

/**
 * @param {string} id
 */
export function resetOption(id) {
    if (id === undefined || id === null || id === '') {
        return
    }

    listing.call('reset', id)
}
