import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { pageTarget, scrollEdges } from '@views-theme/modules/shared/scroll.js'

/**
 * Items of equal width separated by a gap, as logical edges.
 *
 * @param {number} count
 * @param {number} width
 * @param {number} gap
 */
function row(count, width = 200, gap = 16) {
    return Array.from({ length: count }, (_, i) => {
        const start = i * (width + gap)
        return { start, end: start + width }
    })
}

describe('scrollEdges', () => {
    it('reports no overflow when content fits', () => {
        assert.deepEqual(scrollEdges({ scrollLeft: 0, scrollWidth: 600, clientWidth: 600 }), {
            x: 0,
            max: 0,
            overflow: false,
            atStart: true,
            atEnd: true,
        })
    })

    it('ignores sub-pixel overflow', () => {
        const edges = scrollEdges({ scrollLeft: 0, scrollWidth: 600.5, clientWidth: 600 })
        assert.equal(edges.overflow, false)
    })

    it('detects start, middle and end', () => {
        const metrics = { scrollWidth: 2000, clientWidth: 1000 }

        assert.deepEqual(
            [0, 500, 1000].map((scrollLeft) => {
                const { atStart, atEnd } = scrollEdges({ ...metrics, scrollLeft })
                return [atStart, atEnd]
            }),
            [
                [true, false],
                [false, false],
                [false, true],
            ],
        )
    })

    it('treats negative RTL scrollLeft as a logical offset', () => {
        const edges = scrollEdges({ scrollLeft: -1000, scrollWidth: 2000, clientWidth: 1000 })
        assert.equal(edges.x, 1000)
        assert.equal(edges.atEnd, true)
        assert.equal(edges.atStart, false)
    })

    it('clamps overscroll to the end', () => {
        assert.equal(scrollEdges({ scrollLeft: 1200, scrollWidth: 2000, clientWidth: 1000 }).x, 1000)
    })
})

describe('pageTarget', () => {
    // 10 items × 200px + 16px gap → 2144px content, 1000px viewport
    const items = row(10)
    const max = 2144 - 1000

    it('returns null when there is no overflow', () => {
        assert.equal(pageTarget({ x: 0, max: 0, viewport: 1000, items: row(3), direction: 'next' }), null)
    })

    it('next starts at the first partially visible item (no skipped items)', () => {
        // items 0–3 end at 848; item 4 spans 864–1064 and is cut off
        assert.equal(pageTarget({ x: 0, max, viewport: 1000, items, direction: 'next' }), 864)
    })

    it('next clamps to the end', () => {
        assert.equal(pageTarget({ x: 864, max, viewport: 1000, items, direction: 'next' }), max)
    })

    it('prev moves back by at most one viewport, aligned to an item', () => {
        assert.equal(pageTarget({ x: 1080, max, viewport: 1000, items, direction: 'prev' }), 216)
        assert.equal(pageTarget({ x: 864, max, viewport: 1000, items, direction: 'prev' }), 0)
    })

    it('clamps at the ends without rewind', () => {
        assert.equal(pageTarget({ x: 0, max, viewport: 1000, items, direction: 'prev' }), null)
        assert.equal(pageTarget({ x: max, max, viewport: 1000, items, direction: 'next' }), null)
    })

    it('wraps at the ends with rewind', () => {
        assert.equal(pageTarget({ x: 0, max, viewport: 1000, items, direction: 'prev', rewind: true }), max)
        assert.equal(pageTarget({ x: max, max, viewport: 1000, items, direction: 'next', rewind: true }), 0)
    })

    it('falls back to a viewport step when one item is wider than the viewport', () => {
        const wide = row(3, 1500, 0)
        assert.equal(pageTarget({ x: 0, max: 3500, viewport: 1000, items: wide, direction: 'next' }), 1000)
        assert.equal(pageTarget({ x: 1000, max: 3500, viewport: 1000, items: wide, direction: 'prev' }), 0)
    })
})
