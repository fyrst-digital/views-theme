/**
 * Shared JSDoc typedefs for ViewsTheme storefront modules and components.
 * Runtime: empty module (import only for types if needed).
 *
 * @module @views-theme/modules/types
 */

/**
 * Query string bag used for listing XHR and history.
 * @typedef {Record<string, string>} ListingRequestParams
 */

/**
 * Product:Listing static options (data-component-options).
 * @typedef {object} ListingOptions
 * @property {string|null} [resultsUrl]
 * @property {string|null} [aggregationsUrl]
 * @property {string|null} [filterOptionsUrl]
 * @property {Record<string, unknown>|object} [baseParams]
 * @property {Record<string, unknown>|object} [display]
 * @property {boolean} [disableEmptyFilter]
 * @property {boolean} [ariaLiveUpdates]
 * @property {boolean} [history]
 * @property {string} [resultsComponent]
 * @property {string} [panelComponent]
 * @property {string} [changedEvent]
 * @property {string} [syncedEvent]
 * @property {string} [availabilitySyncedEvent]
 * @property {string} [loadingEvent]
 * @property {number} [scrollOffset]
 * @property {string[]} [controlComponents]
 * @property {string[]} [displayParamKeys]
 */

/**
 * Context passed into listing module factories.
 * @typedef {object} ListingModuleContext
 * @property {Element} el
 * @property {() => ListingOptions} getOptions
 */

/**
 * Active filter chip label.
 * @typedef {object} ListingLabel
 * @property {string} id
 * @property {string} label
 * @property {string} [previewImageUrl]
 * @property {string} [previewHex]
 */

/**
 * Listing filter/pagination/sorting control contract (duck-typed).
 * @typedef {object} ListingControl
 * @property {Element} [el]
 * @property {object} [options]
 * @property {string} [options.name]
 * @property {string} [options.filterKey]
 * @property {string} [options.propertyName]
 * @property {() => Record<string, unknown>} getValues
 * @property {() => string[]} [getParamKeys]
 * @property {(params: Record<string, string>) => void} [setFromUrl]
 * @property {() => ListingLabel[]} [getLabels]
 * @property {(id: string) => void} [reset]
 * @property {() => void} [resetAll]
 * @property {(html: string) => void} [replaceOptions]
 * @property {(meta: object) => void} [applyOptionsMeta]
 * @property {(aggregations: object) => void} [applyAvailability]
 */

/**
 * Batch filter-options JSON from theme XHR.
 * @typedef {object} FilterOptionsPayload
 * @property {Record<string, string>} [options]
 * @property {Record<string, Record<string, unknown>>} [meta]
 */

/**
 * @typedef {object} HttpFetchOptions
 * @property {AbortSignal} [signal]
 * @property {Record<string, string>} [headers]
 * @property {string} [method]
 * @property {BodyInit|null} [body]
 * @property {RequestRedirect} [redirect]
 */

/**
 * @typedef {object} HttpTextResult
 * @property {number} status
 * @property {string} text
 */

/**
 * @typedef {object} RequestState
 * @property {AbortController|null} [controller]
 * @property {number} [seq]
 */

/**
 * @typedef {object} BeginRequestResult
 * @property {AbortController} controller
 * @property {AbortSignal} signal
 * @property {number} id
 * @property {() => boolean} isCurrent
 */

/**
 * @typedef {object} ApplyListingOptions
 * @property {string} [listingComponent]
 * @property {{ pushHistory?: boolean, resetPage?: boolean }} [callOptions]
 */

/**
 * @template TJob
 * @typedef {object} SerialQueueOptions
 * @property {(job: TJob) => string|null|undefined} [coalesceKey]
 */

/**
 * @typedef {object} CartQueueJob
 * @property {string} action
 * @property {() => Promise<void>} runner
 * @property {object} [payload]
 */

/**
 * @typedef {object} WishlistQueueJob
 * @property {string} action
 * @property {() => Promise<void>} runner
 * @property {object} [payload]
 */

export {}
