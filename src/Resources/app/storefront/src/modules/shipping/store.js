/**
 * Shipping calculation store (country / payment method / shipping method).
 *
 * Fields write here; `Cart` is the only executor and subscribes to `request`.
 * One store per page, so a cart page and an open drawer stay in sync.
 *
 * @module @views-theme/modules/shipping/store
 */
import { createFieldStore } from '@views-theme/modules/shared/field-store.js'

/**
 * @typedef {import('@views-theme/modules/shared/field-store.js').FieldValues} ShippingValues
 * @typedef {import('@views-theme/modules/shared/field-store.js').FieldRequest} ShippingRequest
 */

export const { values, request, connect, select } = createFieldStore()
