/** Listing Results island DOM helpers. */

import { replaceComponentIsland } from '@views-theme/modules/shared/dom.js'
import { waitForComponentsIn } from '@views-theme/modules/shared/component.js'

const RESULTS_CONTROL_NAMES = ['ViewsTheme:Pagination', 'ViewsTheme:Sorting']

/**
 * @param {Element} root
 * @param {string} html
 * @param {string} resultsComponent
 */
export function replaceResults(root, html, resultsComponent) {
    replaceComponentIsland(root, html, resultsComponent)
}

/**
 * @param {Element} root
 * @param {string} resultsComponent
 * @param {number} [retries]
 */
export async function waitForResultsControls(root, resultsComponent, retries = 20) {
    const results = root.querySelector(`[data-component="${resultsComponent}"]`)
    if (!results) {
        return
    }
    await waitForComponentsIn(results, RESULTS_CONTROL_NAMES, retries)
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
 * @param {object} options
 * @param {Element} listingEl
 */
export function updateAriaLive(options, listingEl) {
    if (!options.ariaLiveUpdates) {
        return
    }

    const results = listingEl.querySelector(
        `[data-component="${options.resultsComponent}"]`,
    )
    const text = results?.getAttribute('data-aria-live-text')
    if (!text) {
        return
    }

    const panelName = options.panelComponent || 'ViewsTheme:Filter:Panel'
    document.querySelectorAll(`[data-component="${panelName}"]`).forEach((panel) => {
        const live = panel.querySelector('[data-aria-live]')
        if (live) {
            live.textContent = text
        }
    })
}
