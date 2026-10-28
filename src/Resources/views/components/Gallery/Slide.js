import { galleries } from '@views-theme/modules/gallery/store.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Slide: pauses its own videos while it is not the active slide.
 *
 * @extends {ThemeComponent}
 */
export default class GallerySlide extends ThemeComponent {
    static options = {
        galleryId: null,
        index: 0,
    }

    init() {
        const position = Number(this.options.index) || 0
        this.scope.effect(galleries.get(this.options.galleryId).index, (index) => {
            if (index !== position) {
                this._pause()
            }
        })
    }

    destroy() {
        this._pause()

        super.destroy()
    }

    _pause() {
        for (const video of this.el.querySelectorAll('video')) {
            video.pause()
        }
    }
}
