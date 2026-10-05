/**
 * Shared Listing.apply entry for filter controls.
 *
 * @module @views-theme/modules/listing/apply
 */

/**
 * @param {Record<string, unknown>} [patch]
 * @param {import('@views-theme/modules/types.js').ApplyListingOptions} [options]
 */
export function applyListing(patch = {}, options = {}) {
    const listingComponent = options.listingComponent || 'ViewsTheme:Product:Listing'
    const callOptions = {
        resetPage: false,
        ...(options.callOptions || {}),
    }
    const next = { p: 1, ...patch }

    window.Shopware.callMethod(listingComponent, 'apply', next, callOptions)
}

/**
 * @param {string} [listingComponent]
 */
export function syncListingControls(listingComponent = 'ViewsTheme:Product:Listing') {
    window.Shopware.callMethod(listingComponent, 'syncControls')
}

/**
 * Reset facets by filter key, or every facet when keys is omitted.
 *
 * @param {string} [listingComponent]
 * @param {string|string[]|null} [keys]
 */
export function resetListing(listingComponent = 'ViewsTheme:Product:Listing', keys = null) {
    window.Shopware.callMethod(listingComponent, 'resetFilters', keys ?? null)
}

/**
 * Clear one selected option (active chip).
 *
 * @param {string} [listingComponent]
 * @param {string} id
 */
export function resetListingOption(listingComponent = 'ViewsTheme:Product:Listing', id) {
    if (id === undefined || id === null || id === '') {
        return
    }
    window.Shopware.callMethod(listingComponent, 'reset', id)
}
