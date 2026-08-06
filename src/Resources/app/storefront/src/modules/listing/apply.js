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
 * @param {string} [listingComponent]
 * @param {string} [id]
 */
export function resetListing(listingComponent = 'ViewsTheme:Product:Listing', id) {
    if (id !== undefined && id !== null && id !== '') {
        window.Shopware.callMethod(listingComponent, 'reset', id)
        return
    }
    window.Shopware.callMethod(listingComponent, 'resetAll')
}
