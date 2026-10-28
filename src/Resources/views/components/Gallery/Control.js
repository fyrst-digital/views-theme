import { galleries, isDisabled, step } from '@views-theme/modules/gallery/store.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Prev/next control — steps the gallery store; disabled state follows it.
 *
 * @extends {ThemeComponent}
 */
export default class GalleryControl extends ThemeComponent {
    static options = {
        galleryId: null,
        direction: 'next',
    }

    init() {
        this._direction = this.options.direction === 'prev' ? 'prev' : 'next'
        this._onClick = this._onClick.bind(this)
        this._sync = this._sync.bind(this)
        this.scope.on(this.el, 'click', this._onClick)

        const { count, index } = galleries.get(this.options.galleryId)
        this.scope.effect(index, this._sync)
        this.scope.watch(count, this._sync)
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        event.preventDefault()
        if (this.el.disabled) {
            return
        }

        step(this.options.galleryId, this._direction)
    }

    _sync() {
        const disabled = isDisabled(this.options.galleryId, this._direction)
        this.el.disabled = disabled
        this.el.setAttribute('aria-disabled', disabled ? 'true' : 'false')
    }
}
