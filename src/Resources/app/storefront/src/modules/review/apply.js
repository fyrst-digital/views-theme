/**
 * Shared Review:Panel.apply entry for review controls.
 *
 * @module @views-theme/modules/review/apply
 */

/**
 * @param {Record<string, unknown>} [patch]
 * @param {{ panelComponent?: string, callOptions?: Record<string, unknown> }} [options]
 */
export function applyReview(patch = {}, options = {}) {
    const panelComponent = options.panelComponent || 'ViewsTheme:Review:Panel'
    const callOptions = {
        resetPage: true,
        ...(options.callOptions || {}),
    }
    const next = callOptions.resetPage === false ? { ...patch } : { p: 1, ...patch }

    window.Shopware.callMethod(panelComponent, 'apply', next, callOptions)
}

/**
 * @param {string} [panelComponent]
 */
export function syncReviewControls(panelComponent = 'ViewsTheme:Review:Panel') {
    window.Shopware.callMethod(panelComponent, 'syncControls')
}
