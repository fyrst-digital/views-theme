/**
 * Form field enable / required / invalid chrome.
 *
 * @module @views-theme/modules/shared/form
 */

/**
 * @typedef {{ required: boolean, disabledByUs: boolean }} FieldToggleState
 */

/** @type {WeakMap<Element, FieldToggleState>} */
const toggleState = new WeakMap()

/**
 * @param {Element|null|undefined} field
 * @returns {field is HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement}
 */
export function isFormControl(field) {
    return field instanceof HTMLInputElement
        || field instanceof HTMLSelectElement
        || field instanceof HTMLTextAreaElement
}

/**
 * @param {Element|null|undefined} field
 * @param {boolean} required
 */
export function setRequired(field, required) {
    if (!isFormControl(field)) {
        return
    }
    field.required = required
    if (required) {
        field.setAttribute('aria-required', 'true')
    } else {
        field.removeAttribute('aria-required')
    }
}

/**
 * Disable or restore a control. Remembers required / our disable so show can restore.
 *
 * @param {Element|null|undefined} field
 * @param {boolean} enabled
 */
export function setFieldEnabled(field, enabled) {
    if (!(isFormControl(field) || field instanceof HTMLButtonElement)) {
        return
    }

    const state = toggleState.get(field) ?? { required: false, disabledByUs: false }

    if (enabled) {
        if (state.disabledByUs) {
            field.disabled = false
            state.disabledByUs = false
        }
        if (state.required && isFormControl(field)) {
            setRequired(field, true)
            state.required = false
        }
        toggleState.set(field, state)
        return
    }

    if (isFormControl(field) && field.required) {
        state.required = true
        setRequired(field, false)
    }
    if (!field.disabled) {
        field.disabled = true
        state.disabledByUs = true
    }
    toggleState.set(field, state)
}

/**
 * Bootstrap invalid chrome on the control (`is-invalid` + `aria-invalid`).
 *
 * @param {Element|null|undefined} field
 * @param {boolean} invalid
 */
export function setInvalidChrome(field, invalid) {
    if (!isFormControl(field) || field.disabled) {
        return
    }
    field.classList.toggle('is-invalid', invalid)
    if (invalid) {
        field.setAttribute('aria-invalid', 'true')
    } else {
        field.removeAttribute('aria-invalid')
    }
}
