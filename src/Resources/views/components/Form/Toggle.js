import { getInstanceByElement } from '@views-theme/modules/shared/component.js'
import { setFieldEnabled } from '@views-theme/modules/shared/form.js'

/**
 * Show/hide a field group from a switch or select control.
 *
 * @extends {ShopwareComponent}
 */
export default class FormToggle extends ShopwareComponent {
    static options = {
        value: '1',
        contentId: null,
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this._control = this._findControl()
        this._control?.addEventListener('change', this._onChange)
        this.sync()
    }

    destroy() {
        this._control?.removeEventListener('change', this._onChange)
    }

    sync() {
        const content = this._content()
        if (!content) {
            return
        }

        const visible = this._isMatch()
        content.hidden = !visible
        content.inert = !visible
        if ('disabled' in content) {
            content.disabled = !visible
        }
        this._setFieldsEnabled(content, visible)
        this._syncNested()
    }

    /**
     * @param {Event} event
     */
    _onChange(event) {
        if (event.target !== this._control) {
            return
        }
        this.sync()
    }

    /**
     * @returns {HTMLElement|null}
     */
    _content() {
        const id = this.options.contentId
        if (!id) {
            return null
        }
        return this.el.querySelector(`#${CSS.escape(id)}`)
    }

    /**
     * @returns {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|null}
     */
    _findControl() {
        const content = this._content()
        const controls = this.el.querySelectorAll('input, select, textarea')
        for (const control of controls) {
            if (content && content.contains(control)) {
                continue
            }
            return control
        }
        return null
    }

    /**
     * @returns {boolean}
     */
    _isMatch() {
        const control = this._control
        if (!control) {
            return false
        }

        const expected = String(this.options.value)
        if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
            return control.checked && String(control.value) === expected
        }

        return String(control.value) === expected
    }

    /**
     * @param {HTMLElement} root
     * @param {boolean} enabled
     */
    _setFieldsEnabled(root, enabled) {
        root.querySelectorAll('input, select, textarea, button').forEach((field) => {
            setFieldEnabled(field, enabled)
        })
    }

    _syncNested() {
        const content = this._content()
        if (!content) {
            return
        }

        content.querySelectorAll('[data-component="ViewsTheme:Form:Toggle"]').forEach((el) => {
            getInstanceByElement('ViewsTheme:Form:Toggle', el)?.sync()
        })
    }
}
