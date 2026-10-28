/**
 * Listing state (page singleton: one Product:Listing per page) and its owner service.
 *
 * `store.js` is the facade controls import; the owner and the control registry
 * write these directly.
 *
 * @module @views-theme/modules/listing/state
 */
import { createService } from '@views-theme/modules/shared/service.js'
import { createStore } from '@views-theme/modules/shared/store.js'

/**
 * Signals: `busy` (a results / filter-options request is in flight), `params`
 * (last applied request params, same shape as the URL query: multi values joined
 * by `|`), `labels` (de-duped active chip labels) and `liveText` (screen-reader
 * text for the last results update — a fresh object per update so identical text
 * re-announces).
 */
export const { busy, params, labels, liveText } = createStore({
    busy: false,
    params: /** @type {Record<string, unknown>} */ ({}),
    labels: /** @type {import('@views-theme/modules/types.js').ListingLabel[]} */ ([]),
    liveText: /** @type {{ text: string }} */ ({ text: '' }),
}).get()

/** The mounted Product:Listing (executor): `apply`, `reset`, `resetFilters`. */
export const listing = createService()

/** An executor (Product:Listing) is mounted. */
export const attached = listing.ready
