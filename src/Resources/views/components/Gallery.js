import { galleries, select, step } from '@views-theme/modules/gallery/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * PDP gallery owner — seeds the gallery store (`galleryId`), handles keyboard
 * navigation and emits the public change event. Thumbs, dots, controls, slides,
 * canvas and thumbnails bind to the store themselves.
 *
 * @extends {ThemeComponent}
 */
export default class Gallery extends ThemeComponent {
    static options = {
        galleryId: null,
        changeEvent: 'ViewsTheme:Gallery:Change',
        active: 0,
        count: 0,
        rewind: true,
    }

    init() {
        this._id = this.options.galleryId
        this._onKeydown = this._onKeydown.bind(this)
        this.scope.on(this.el, 'keydown', this._onKeydown)

        const store = galleries.get(this._id)
        store.rewind.set(this.options.rewind === true || this.options.rewind === 'true')
        store.count.set(Number(this.options.count) || 0)
        select(this._id, this.options.active)

        this.scope.watch(store.index, (index) => {
            window.Shopware.emit(this.options.changeEvent, { el: this.el, index })
        })
    }

    destroy() {
        galleries.drop(this._id)

        super.destroy()
    }

    /**
     * @param {number} index
     */
    select(index) {
        select(this._id, index)
    }

    prev() {
        step(this._id, 'prev')
    }

    next() {
        step(this._id, 'next')
    }

    /**
     * @returns {number}
     */
    getIndex() {
        return galleries.get(this._id).index.get()
    }

    /**
     * @param {KeyboardEvent} event
     */
    _onKeydown(event) {
        if (galleries.get(this._id).count.get() <= 1) {
            return
        }

        if (!this.el.contains(event.target)) {
            return
        }

        if (event.target.closest('input, textarea, select, video, [contenteditable="true"]')) {
            return
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault()
            this.prev()
            return
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault()
            this.next()
        }
    }
}
