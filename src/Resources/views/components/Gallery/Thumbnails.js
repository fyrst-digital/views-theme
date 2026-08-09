import { getInstanceByElement } from '@views-theme/modules/shared/component.js'

/**
 * Thumbnail strip — scrolls the active thumb into view.
 * Scrollport is nested ViewsTheme:Scroll:Area (axis-correct edge fades).
 *
 * @extends {ShopwareComponent}
 */
export default class GalleryThumbnails extends ShopwareComponent {
    static options = {
        thumbComponent: 'ViewsTheme:Gallery:Thumb',
        scrollComponent: 'ViewsTheme:Scroll:Area',
    }

    init() {}

    /**
     * @param {number} index
     */
    scrollToIndex(index) {
        const thumbs = this._thumbs()
        const thumb = thumbs[index]
        const track = this._track()
        if (!thumb || !track) {
            return
        }

        const vertical = track.scrollHeight > track.clientHeight
        if (vertical) {
            const top =
                thumb.offsetTop -
                track.offsetTop -
                (track.clientHeight - thumb.offsetHeight) / 2
            track.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
        } else {
            const left =
                thumb.offsetLeft -
                track.offsetLeft -
                (track.clientWidth - thumb.offsetWidth) / 2
            track.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
        }

        getInstanceByElement(this.options.scrollComponent, track)?.sync?.()
    }

    /**
     * @returns {HTMLElement|null}
     */
    _track() {
        return this.el.querySelector(
            `[data-component="${this.options.scrollComponent}"]`,
        )
    }

    /**
     * @returns {HTMLElement[]}
     */
    _thumbs() {
        return Array.from(
            this.el.querySelectorAll(
                `[data-component="${this.options.thumbComponent}"]`,
            ),
        )
    }
}
