/**
 * Listing Results island DOM helpers.
 *
 * @module @views-theme/modules/listing/results-dom
 */

import { replaceComponentIsland } from '@views-theme/modules/shared/dom.js'

/**
 * @param {Element} root
 * @param {string} html
 * @param {string} resultsComponent
 */
export function replaceResults(root, html, resultsComponent) {
    replaceComponentIsland(root, html, resultsComponent)
}

/**
 * @param {Element} el
 * @param {number} [scrollOffset]
 */
export function scrollToListing(el, scrollOffset = 0) {
    const rect = el.getBoundingClientRect()
    if (rect.top >= 0) {
        return
    }

    const top = rect.top + window.scrollY - (scrollOffset || 0)
    window.scrollTo({ top, behavior: 'smooth' })
}

/**
 * Screen-reader text the server rendered on the Results island, or `null`.
 *
 * @param {import('@views-theme/modules/types.js').ListingOptions} options
 * @param {Element} listingEl
 * @returns {string|null}
 */
export function readAriaLiveText(options, listingEl) {
    if (!options.ariaLiveUpdates) {
        return null
    }

    const results = listingEl.querySelector(
        `[data-component="${options.resultsComponent}"]`,
    )

    return results?.getAttribute('data-aria-live-text') || null
}
