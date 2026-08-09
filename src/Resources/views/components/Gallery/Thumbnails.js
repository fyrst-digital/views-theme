/**
 * Thumbnail strip — scrolls the active thumb into view.
 *
 * @extends {ShopwareComponent}
 */
export default class GalleryThumbnails extends ShopwareComponent {
    static options = {
        thumbComponent: 'ViewsTheme:Gallery:Thumb',
    }

    init() {}

    /**
     * @param {number} index
     */
    scrollToIndex(index) {
        const thumbs = this._thumbs()
        const thumb = thumbs[index]
        const track = thumbs[0]?.parentElement
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
            return
        }

        const left =
            thumb.offsetLeft -
            track.offsetLeft -
            (track.clientWidth - thumb.offsetWidth) / 2
        track.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
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
