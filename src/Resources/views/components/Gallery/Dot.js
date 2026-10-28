import { bindIndexItem } from '@views-theme/modules/gallery/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Dot: click selects its index, `aria-current` follows the gallery store.
 *
 * @extends {ThemeComponent}
 */
export default class GalleryDot extends ThemeComponent {
    static options = {
        galleryId: null,
        index: 0,
    }

    init() {
        bindIndexItem(this.scope, this.el, this.options.galleryId, Number(this.options.index) || 0)
    }
}
