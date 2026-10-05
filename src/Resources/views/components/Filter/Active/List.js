import { resetOption, subscribe } from '@views-theme/modules/listing/store.js'

/**
 * Paints removable active chips into the shell's flex row.
 *
 * @extends {ShopwareComponent}
 */
export default class FilterActiveList extends ShopwareComponent {
    static options = {
        removeLabel: 'Remove filter',
    }

    init() {
        this._chipTemplate = this.el.querySelector(':scope > template')
        this._onSnapshot = this._onSnapshot.bind(this)
        this._onClick = this._onClick.bind(this)
        this._unsubscribe = subscribe(this._onSnapshot)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this._unsubscribe?.()
        this._unsubscribe = null
        this.el.removeEventListener('click', this._onClick)
    }

    /**
     * @param {import('@views-theme/modules/listing/store.js').ListingSnapshot} snapshot
     */
    _onSnapshot(snapshot) {
        this._render(snapshot?.labels || [])
    }

    _onClick(event) {
        const target = event.target instanceof Element
            ? event.target.closest('[data-filter-id]')
            : null
        if (!target || !this.el.contains(target)) {
            return
        }

        event.preventDefault()

        const id = target.getAttribute('data-filter-id')
        if (id) {
            resetOption(id)
        }
    }

    _clearLive() {
        this.el.querySelectorAll(':scope > :not(template)').forEach((node) => {
            node.remove()
        })
    }

    /**
     * Hide the list and the Active shell so the reset button follows the chips.
     */
    _setOpen(open) {
        this.el.hidden = !open
        const shell = this.el.parentElement
        if (shell) {
            shell.hidden = !open
        }
    }

    /**
     * @param {import('@views-theme/modules/types.js').ListingLabel[]} labels
     */
    _render(labels) {
        if (!this._chipTemplate) {
            this._setOpen(false)
            return
        }

        this._clearLive()

        if (!labels.length) {
            this._setOpen(false)
            return
        }

        this._setOpen(true)

        labels.forEach((item) => {
            const node = this._chipTemplate.content.cloneNode(true)
            const button = node.querySelector('[data-filter-id]')
            const labelEl = node.querySelector('[data-active-chip-label]')
            const swatch = node.querySelector('[data-active-chip-swatch]')
            if (button) {
                button.setAttribute('data-filter-id', item.id)
                button.setAttribute(
                    'aria-label',
                    `${this.options.removeLabel}: ${item.label}`,
                )
            }
            if (labelEl) {
                labelEl.textContent = item.label
            }
            this._paintSwatch(swatch, item)
            this.el.appendChild(node)
        })
    }

    /**
     * Prefer image over hex (same order as Filter:Chip). Style only — no HTML inject.
     */
    _paintSwatch(swatch, item) {
        if (!swatch) {
            return
        }

        const image = typeof item?.previewImageUrl === 'string' ? item.previewImageUrl.trim() : ''
        const hex = typeof item?.previewHex === 'string' ? item.previewHex.trim() : ''

        if (image) {
            swatch.hidden = false
            swatch.style.backgroundImage = `url("${image.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`
            swatch.style.backgroundColor = ''
            return
        }

        if (hex) {
            swatch.hidden = false
            swatch.style.backgroundImage = ''
            swatch.style.backgroundColor = hex
            return
        }

        swatch.hidden = true
        swatch.removeAttribute('style')
    }
}
