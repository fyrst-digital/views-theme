/**
 * Shared option/control param helpers for URL-SoT owners (listing, review, …).
 *
 * @module @views-theme/modules/shared/object-option
 */

/**
 * @param {unknown} value
 * @returns {Record<string, unknown>}
 */
export function objectOption(value) {
    if (!value || Array.isArray(value)) {
        return {}
    }
    return typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {}
}

/**
 * Merge getValues() from control instances (arrays de-duped).
 *
 * @param {Iterable<{ getValues?: () => Record<string, unknown> }>} controls
 * @returns {Record<string, unknown>}
 */
export function collectControlValues(controls) {
    /** @type {Record<string, unknown>} */
    const values = {}
    for (const control of controls) {
        const part = (typeof control.getValues === 'function' ? control.getValues() : null) || {}
        Object.entries(part).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                const prev = Array.isArray(values[key]) ? /** @type {unknown[]} */ (values[key]) : []
                values[key] = [...new Set([...prev, ...value.map(String)])]
                return
            }
            if (value !== null && value !== undefined && value !== '') {
                values[key] = value
            }
        })
    }
    return values
}
