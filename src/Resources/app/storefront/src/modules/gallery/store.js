/**
 * Per-gallery state: one store per server-rendered `galleryId`.
 *
 * `Gallery` seeds `count` / `rewind` / `index` from its options; Canvas, Thumbnails,
 * Thumb, Dot, Control and Slide read and write the signals directly. Nothing
 * finds the owner through the DOM.
 *
 * @module @views-theme/modules/gallery/store
 */
import { createStore } from '@views-theme/modules/shared/store.js'

export const galleries = createStore({ index: 0, count: 0, rewind: true })

/**
 * Activate an index (clamped to the known count).
 *
 * @param {string} id
 * @param {number} index
 */
export function select(id, index) {
    const { count, index: current } = galleries.get(id)
    const max = count.get() - 1
    if (max < 0) {
        return
    }

    current.set(Math.max(0, Math.min(Number(index) || 0, max)))
}

/**
 * @param {string} id
 * @param {'prev'|'next'} direction
 */
export function step(id, direction) {
    const { count, index, rewind } = galleries.get(id)
    const max = count.get() - 1
    if (max < 0) {
        return
    }

    const delta = direction === 'prev' ? -1 : 1
    const target = index.get() + delta
    if (target < 0 || target > max) {
        if (rewind.get()) {
            select(id, target < 0 ? max : 0)
        }
        return
    }

    select(id, target)
}

/**
 * Whether a prev/next control is disabled at the current index.
 *
 * @param {string} id
 * @param {'prev'|'next'} direction
 * @returns {boolean}
 */
export function isDisabled(id, direction) {
    const { count, index, rewind } = galleries.get(id)
    if (rewind.get()) {
        return false
    }

    return direction === 'prev' ? index.get() <= 0 : index.get() >= count.get() - 1
}

/**
 * Bind a Thumb / Dot to the gallery: click selects its index, `aria-current`
 * follows the active index. Cleanup goes into the component's scope.
 *
 * @param {import('@views-theme/modules/shared/scope.js').Scope} scope
 * @param {HTMLElement} el
 * @param {string} id
 * @param {number} position
 */
export function bindIndexItem(scope, el, id, position) {
    scope.on(el, 'click', (event) => {
        event.preventDefault()
        select(id, position)
    })
    scope.effect(galleries.get(id).index, (index) => {
        el.setAttribute('aria-current', index === position ? 'true' : 'false')
    })
}
