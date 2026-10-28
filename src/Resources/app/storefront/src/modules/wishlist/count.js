/**
 * Number of products on the wishlist. `Wishlist` (the mutation owner) writes it;
 * the header badge and its live region follow it.
 *
 * @module @views-theme/modules/wishlist/count
 */
import { createStore } from '@views-theme/modules/shared/store.js'

export const { count: wishlistCount } = createStore({ count: Number(window.wishlistCount) || 0 }).get()
