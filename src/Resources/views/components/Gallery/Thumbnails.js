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

        const thumbRect = thumb.getBoundingClientRect()
        const trackRect = track.getBoundingClientRect()
        const vertical = track.scrollHeight > track.clientHeight

        if (vertical) {
            const top =
                track.scrollTop +
                (thumbRect.top - trackRect.top) -
                (track.clientHeight - thumbRect.height) / 2
            const max = Math.max(0, track.scrollHeight - track.clientHeight)
            track.scrollTo({
                top: Math.max(0, Math.min(top, max)),
                behavior: 'smooth',
            })
        } else {
            const left =
                track.scrollLeft +
                (thumbRect.left - trackRect.left) -
                (track.clientWidth - thumbRect.width) / 2
            const max = Math.max(0, track.scrollWidth - track.clientWidth)
            track.scrollTo({
                left: Math.max(0, Math.min(left, max)),
                behavior: 'smooth',
            })
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
