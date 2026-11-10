/**
 * Pure horizontal scrollport math (no DOM writes). Offsets are **logical**:
 * distance from the inline start edge, so LTR and RTL (negative `scrollLeft`)
 * share one code path.
 *
 * @module @views-theme/modules/shared/scroll
 */

/** Sub-pixel slack for fractional scroll positions and zoom. */
export const EDGE_TOLERANCE = 1

/**
 * @typedef {object} ScrollEdges
 * @property {number} x Logical scroll offset (clamped to `[0, max]`)
 * @property {number} max Largest logical offset (`scrollWidth - clientWidth`)
 * @property {boolean} overflow Content is wider than the scrollport
 * @property {boolean} atStart
 * @property {boolean} atEnd
 */

/**
 * @param {{ scrollLeft: number, scrollWidth: number, clientWidth: number }} metrics
 * @returns {ScrollEdges}
 */
export function scrollEdges({ scrollLeft, scrollWidth, clientWidth }) {
    const max = Math.max(0, scrollWidth - clientWidth)
    // abs() covers LTR and RTL (negative scrollLeft)
    const x = Math.min(Math.abs(scrollLeft), max)
    const overflow = max > EDGE_TOLERANCE

    return {
        x,
        max,
        overflow,
        atStart: !overflow || x <= EDGE_TOLERANCE,
        atEnd: !overflow || x >= max - EDGE_TOLERANCE,
    }
}

/**
 * Logical offset for one page step, aligned to an item edge so no item is
 * skipped: `next` starts at the first item that is not fully visible, `prev`
 * moves back by at most one viewport. Clamped at the ends unless `rewind`.
 *
 * @param {object} state
 * @param {number} state.x Logical scroll offset
 * @param {number} state.max Largest logical offset
 * @param {number} state.viewport Scrollport width (`clientWidth`)
 * @param {{ start: number, end: number }[]} state.items Logical item edges, in order
 * @param {'prev'|'next'} state.direction
 * @param {boolean} [state.rewind]
 * @returns {number|null} Target offset, or `null` when there is nothing to do
 */
export function pageTarget({ x, max, viewport, items, direction, rewind = false }) {
    if (max <= EDGE_TOLERANCE) {
        return null
    }

    if (direction === 'prev') {
        if (x <= EDGE_TOLERANCE) {
            return rewind ? max : null
        }

        const limit = x - viewport - EDGE_TOLERANCE
        const item = items.find((entry) => entry.start >= limit)
        const target = item && item.start < x - EDGE_TOLERANCE ? item.start : x - viewport

        return Math.max(0, target)
    }

    if (x >= max - EDGE_TOLERANCE) {
        return rewind ? 0 : null
    }

    const visibleEnd = x + viewport + EDGE_TOLERANCE
    const item = items.find((entry) => entry.end > visibleEnd)
    const target = item && item.start > x + EDGE_TOLERANCE ? item.start : x + viewport

    return Math.min(max, target)
}

/**
 * Index of the item whose start edge is closest to the logical offset `x`:
 * the snapped item for `scroll-snap-align: start` cells.
 *
 * @param {{ start: number }[]} items Logical item edges, in order
 * @param {number} x Logical scroll offset
 * @returns {number} 0-based index, or `-1` without items
 */
export function nearestIndex(items, x) {
    let best = -1
    let bestDist = Infinity

    items.forEach((item, index) => {
        const dist = Math.abs(item.start - x)
        if (dist < bestDist) {
            best = index
            bestDist = dist
        }
    })

    return best
}
