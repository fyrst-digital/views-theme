/**
 * Client-side address search shared by Address:Manager:List and Account:Addressbook.
 *
 * One filter state per list, keyed by the `listId` rendered by Twig (the manager
 * renders a list per tab). The list owner calls `applyAddressFilter(listId, items, term)`;
 * `Address:Manager:Status` components of that list bind by `kind`. `total` is `null`
 * until the list reported, so a Status keeps its SSR state until then.
 *
 * @module @views-theme/modules/address/filter
 */
import { effect } from '@views-theme/modules/shared/signal.js'
import { createStore } from '@views-theme/modules/shared/store.js'

/**
 * @typedef {{ term: string, total: number|null, visible: number }} AddressFilterState
 */

/** @returns {AddressFilterState} */
const blank = () => ({ term: '', total: null, visible: 0 })

const filters = createStore({ state: blank() })

/**
 * Show / hide rows by text match and publish the counts.
 *
 * @param {string} listId
 * @param {Iterable<HTMLElement>} items
 * @param {string} query
 */
export function applyAddressFilter(listId, items, query) {
    const term = String(query || '').trim().toLowerCase()
    let total = 0
    let visible = 0

    for (const item of items) {
        total += 1
        const match = term === '' || (item.textContent || '').toLowerCase().includes(term)
        item.hidden = !match
        if (match) {
            visible += 1
        }
    }

    filters.get(listId).state.set({ term, total, visible })
}

/**
 * @param {string} listId
 */
export function dropAddressFilter(listId) {
    filters.drop(listId)
}

/**
 * Bind a Status element: `empty` shows when the list has no addresses,
 * `notFound` when a search term matches none.
 *
 * @param {string} listId
 * @param {HTMLElement} el
 * @param {'empty'|'notFound'|string} kind
 * @returns {() => void} unbind
 */
export function bindStatus(listId, el, kind) {
    return effect(filters.get(listId).state, ({ term, total, visible }) => {
        if (total === null) {
            return
        }

        if (kind === 'empty') {
            el.hidden = total !== 0
        }
        if (kind === 'notFound') {
            el.hidden = !(term !== '' && visible === 0 && total > 0)
        }
    })
}
