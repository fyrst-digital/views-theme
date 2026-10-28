/**
 * Review facade for controls (Sort, Language, Matrix, Pagination, Form).
 *
 * Review:Panel is the only executor (`scope.add(attach(this))`). Controls
 * `connectReviewControl` themselves in `init` (no DOM scan), dispatch
 * `applyReview`, and the Form calls `saveReview`. Every dispatch no-ops while no
 * panel is mounted. `attached` tells a control whether a panel is mounted
 * (Pagination uses it to decide to take the click).
 *
 * @module @views-theme/modules/review/store
 */
import { urlParams } from '@views-theme/modules/review/params.js'
import { createRegistry } from '@views-theme/modules/shared/registry.js'
import { createService } from '@views-theme/modules/shared/service.js'
import { createStore } from '@views-theme/modules/shared/store.js'

/** Last applied request params. */
export const { params } = createStore({
    params: /** @type {Record<string, unknown>} */ ({}),
}).get()

/** The mounted Review:Panel (executor): `apply`, `save`. */
const review = createService()

/** A Review:Panel is mounted. */
export const attached = review.ready

/** @type {import('@views-theme/modules/shared/registry.js').Registry<object>} */
const controls = createRegistry()

/**
 * Make `owner` the executor. The returned dispose clears the applied params.
 *
 * @param {object} owner
 * @returns {() => void}
 */
export function attach(owner) {
    const dispose = review.provide(owner)

    return () => {
        if (review.api.get() !== owner) {
            return
        }

        dispose()
        params.set({})
    }
}

/**
 * Register a review control (Sort, Language, Matrix, Pagination). Call from `init`
 * (`scope.add(connectReviewControl(this))`). It hydrates from the last applied
 * params (URL before the first apply) and never triggers a request.
 *
 * @param {{ getValues?: () => Record<string, unknown>, setFromUrl?: (params: Record<string, unknown>) => void }} control
 * @returns {() => void} disconnect
 */
export function connectReviewControl(control) {
    if (!control || typeof control.getValues !== 'function') {
        return () => {}
    }

    const disconnect = controls.connect(control)
    if (typeof control.setFromUrl === 'function') {
        const applied = params.get()
        control.setFromUrl(Object.keys(applied).length ? applied : urlParams())
    }

    return disconnect
}

/**
 * @returns {object[]}
 */
export function connectedControls() {
    return controls.all()
}

/**
 * @param {Record<string, unknown>} next
 */
export function hydrateControls(next) {
    controls.all().forEach((control) => {
        if (typeof control.setFromUrl === 'function') {
            control.setFromUrl(next || {})
        }
    })
}

/**
 * @param {Record<string, unknown>} [patch]
 * @param {{ callOptions?: { pushHistory?: boolean, resetPage?: boolean } }} [options]
 */
export function applyReview(patch = {}, options = {}) {
    const callOptions = {
        resetPage: true,
        ...(options.callOptions || {}),
    }
    const next = callOptions.resetPage === false ? { ...patch } : { p: 1, ...patch }

    review.call('apply', next, callOptions)
}

/**
 * @param {FormData} formData
 * @returns {Promise<void>|null} `null` when no panel is mounted
 */
export function saveReview(formData) {
    return review.call('save', formData) ?? null
}
