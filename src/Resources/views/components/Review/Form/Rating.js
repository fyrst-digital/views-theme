/**
 * Interactive review points picker.
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewFormRating extends ShopwareComponent {
    static options = {
        currentPoints: 5,
    }

    init() {
        this._onChange = this._onChange.bind(this)
        this.el.addEventListener('change', this._onChange)
        this._paint(Number(this.options.currentPoints) || 5)
    }

    destroy() {
        this.el.removeEventListener('change', this._onChange)
    }

    /**
     * @param {Event} event
     */
    _onChange(event) {
        const target = event.target
        if (!(target instanceof HTMLInputElement) || target.name !== 'points') {
            return
        }
        this._paint(Number(target.value) || 0)
    }

    /**
     * @param {number} points
     */
    _paint(points) {
        this.el.querySelectorAll('[data-review-form-point]').forEach((label) => {
            const value = Number(label.getAttribute('data-review-form-point'))
            const active = value <= points
            label.classList.toggle('is-active', active)
        })

        this.el.querySelectorAll('[data-rating-text]').forEach((text) => {
            const value = Number(text.getAttribute('data-rating-text'))
            if (text instanceof HTMLElement) {
                text.hidden = value !== points
            }
        })
    }
}
