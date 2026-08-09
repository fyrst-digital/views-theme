/**
 * Review form points picker — hidden input + data-points icons + hover preview.
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewFormRating extends ShopwareComponent {
    static options = {
        currentPoints: 5,
        /** @type {Record<string, string>} */
        pointLabels: {},
        iconFull: 'star-fill',
        iconEmpty: 'star',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this._onPointerOver = this._onPointerOver.bind(this)
        this._onPointerLeave = this._onPointerLeave.bind(this)

        this._input = this.el.querySelector('input[name="points"]')
        this._text = this.el.querySelector('[data-rating-text]')
        this._stars = this.el.querySelector('[data-rating-stars]')

        this.el.addEventListener('click', this._onClick)
        this._stars?.addEventListener('pointerover', this._onPointerOver)
        this._stars?.addEventListener('pointerleave', this._onPointerLeave)

        this._paint(this._readPoints())
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        this._stars?.removeEventListener('pointerover', this._onPointerOver)
        this._stars?.removeEventListener('pointerleave', this._onPointerLeave)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        const target = event.target instanceof Element
            ? event.target.closest('[data-points]')
            : null
        if (!target || !this.el.contains(target)) {
            return
        }

        const points = Number(target.getAttribute('data-points')) || 0
        if (this._input instanceof HTMLInputElement) {
            this._input.value = String(points)
        }
        this._paint(points)
    }

    /**
     * @param {PointerEvent} event
     */
    _onPointerOver(event) {
        const target = event.target instanceof Element
            ? event.target.closest('[data-points]')
            : null
        if (!target || !this._stars?.contains(target)) {
            return
        }
        this._paint(Number(target.getAttribute('data-points')) || 0)
    }

    _onPointerLeave() {
        this._paint(this._readPoints())
    }

    /**
     * @returns {number}
     */
    _readPoints() {
        if (this._input instanceof HTMLInputElement && this._input.value !== '') {
            return Number(this._input.value) || 0
        }
        return Number(this.options.currentPoints) || 5
    }

    /**
     * @param {number} points
     */
    _paint(points) {
        this.el.querySelectorAll('[data-points]').forEach((icon) => {
            const value = Number(icon.getAttribute('data-points')) || 0
            const active = value <= points
            icon.classList.toggle('is-active', active)
            this._setIconFilled(icon, active)
        })

        if (this._text instanceof HTMLElement) {
            const labels = this.options.pointLabels || {}
            this._text.textContent = labels[`p${points}`] || ''
        }
    }

    /**
     * @param {Element} icon
     * @param {boolean} filled
     */
    _setIconFilled(icon, filled) {
        const full = String(this.options.iconFull || 'star-fill')
        const empty = String(this.options.iconEmpty || 'star')

        ;[...icon.classList].forEach((cls) => {
            if (!cls.startsWith('icon-') || cls === 'icon') {
                return
            }
            if (cls.includes(full)) {
                if (!filled) {
                    icon.classList.replace(cls, cls.replace(full, empty))
                }
                return
            }
            if (cls.includes(empty) && filled) {
                icon.classList.replace(cls, cls.replace(empty, full))
            }
        })
    }
}
