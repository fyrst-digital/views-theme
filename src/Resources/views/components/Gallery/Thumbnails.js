import { getInstanceByElement } from '@views-theme/modules/shared/component.js'
import { galleries } from '@views-theme/modules/gallery/store.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Thumbnail strip — scrolls the active thumb into view.
 * Scrollport is nested ViewsTheme:Scroll:Area (axis-correct edge fades).
 * Axis from computed flex-direction (`flex-md-column` at md).
 *
 * @extends {ThemeComponent}
 */
export default class GalleryThumbnails extends ThemeComponent {
    static options = {
        galleryId: null,
        thumbComponent: 'ViewsTheme:Gallery:Thumb',
        scrollComponent: 'ViewsTheme:Scroll:Area',
    }

    init() {
        this.scope.effect(galleries.get(this.options.galleryId).index, (index) => {
            this.scrollToIndex(index)
        })
    }

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
        const dir = getComputedStyle(track).flexDirection
        const vertical = dir === 'column' || dir === 'column-reverse'
        const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'auto'
            : 'smooth'

        if (vertical) {
            const top =
                track.scrollTop +
                (thumbRect.top - trackRect.top) -
                (track.clientHeight - thumbRect.height) / 2
            const max = Math.max(0, track.scrollHeight - track.clientHeight)
            track.scrollTo({
                top: Math.max(0, Math.min(top, max)),
                behavior,
            })
        } else {
            const left =
                track.scrollLeft +
                (thumbRect.left - trackRect.left) -
                (track.clientWidth - thumbRect.width) / 2
            const max = Math.max(0, track.scrollWidth - track.clientWidth)
            track.scrollTo({
                left: Math.max(0, Math.min(left, max)),
                behavior,
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
