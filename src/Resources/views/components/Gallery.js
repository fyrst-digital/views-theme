import {
    getInstanceByElement,
    waitForInstance,
} from '@views-theme/modules/shared/component.js'

/**
 * PDP gallery owner — syncs thumbs, dots, controls, and scroll-snap canvas.
 * Index SoT lives here; chrome follows ARIA / disabled attrs.
 *
 * @extends {ShopwareComponent}
 */
export default class Gallery extends ShopwareComponent {
    static options = {
        thumbComponent: 'ViewsTheme:Gallery:Thumb',
        dotComponent: 'ViewsTheme:Gallery:Dot',
        controlComponent: 'ViewsTheme:Gallery:Control',
        canvasComponent: 'ViewsTheme:Gallery:Canvas',
        thumbnailsComponent: 'ViewsTheme:Gallery:Thumbnails',
        changeEvent: 'ViewsTheme:Gallery:Change',
        active: 0,
        rewind: true,
    }

    init() {
        this._index = Number(this.options.active) || 0
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
        this._hydrate()
    }

    async _hydrate() {
        await waitForInstance(() => this._canvas())
        this.select(this._index, { emit: false, scroll: true })
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        this._pauseVideos()
    }

    /**
     * @param {number} index
     * @param {{ emit?: boolean, scroll?: boolean }} [options]
     */
    select(index, { emit = true, scroll = true } = {}) {
        const max = this._count() - 1
        if (max < 0) {
            return
        }

        const next = Math.max(0, Math.min(Number(index) || 0, max))
        const changed = next !== this._index
        this._index = next
        this._syncChrome(next)
        this._pauseInactiveVideos()

        if (scroll) {
            this._canvas()?.goTo?.(next)
        }

        this._thumbnails()?.scrollToIndex?.(next)

        if (emit && changed) {
            window.Shopware.emit(this.options.changeEvent, {
                el: this.el,
                index: next,
            })
        }
    }

    /**
     * Canvas-driven index update (no canvas re-scroll).
     *
     * @param {number} index
     * @param {{ emit?: boolean }} [options]
     */
    setIndex(index, { emit = true } = {}) {
        this.select(index, { emit, scroll: false })
    }

    prev() {
        const max = this._count() - 1
        if (max < 0) {
            return
        }

        if (this._index <= 0) {
            if (this._rewind()) {
                this.select(max)
            }
            return
        }

        this.select(this._index - 1)
    }

    next() {
        const max = this._count() - 1
        if (max < 0) {
            return
        }

        if (this._index >= max) {
            if (this._rewind()) {
                this.select(0)
            }
            return
        }

        this.select(this._index + 1)
    }

    /**
     * @returns {number}
     */
    getIndex() {
        return this._index
    }

    /**
     * @returns {boolean}
     */
    _rewind() {
        return this.options.rewind === true || this.options.rewind === 'true'
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        const thumb = event.target.closest(
            `[data-component="${this.options.thumbComponent}"]`,
        )
        if (thumb && this.el.contains(thumb)) {
            event.preventDefault()
            this.select(this._optionIndex(thumb, this.options.thumbComponent))
            return
        }

        const dot = event.target.closest(
            `[data-component="${this.options.dotComponent}"]`,
        )
        if (dot && this.el.contains(dot)) {
            event.preventDefault()
            this.select(this._optionIndex(dot, this.options.dotComponent))
        }
    }

    /**
     * Pause every slide video that is not the active index.
     */
    _pauseInactiveVideos() {
        const active = this._index
        for (const slide of this._slides()) {
            if (this._optionIndex(slide, 'ViewsTheme:Gallery:Slide') === active) {
                continue
            }

            for (const video of slide.querySelectorAll('video')) {
                video.pause()
            }
        }
    }

    /**
     * Pause all gallery videos (destroy / leave).
     */
    _pauseVideos() {
        for (const video of this.el.querySelectorAll('video')) {
            video.pause()
        }
    }

    /**
     * @param {number} index
     */
    _syncChrome(index) {
        for (const el of this._thumbs()) {
            const selected =
                this._optionIndex(el, this.options.thumbComponent) === index
            el.setAttribute('aria-current', selected ? 'true' : 'false')
        }

        for (const el of this._dots()) {
            const selected =
                this._optionIndex(el, this.options.dotComponent) === index
            el.setAttribute('aria-current', selected ? 'true' : 'false')
        }

        const max = this._count() - 1
        const wrap = this._rewind()
        for (const el of this._controls()) {
            const direction = this._optionDirection(el)
            const disabled = wrap
                ? false
                : direction === 'prev'
                  ? index <= 0
                  : index >= max
            el.disabled = disabled
            el.setAttribute('aria-disabled', disabled ? 'true' : 'false')
        }
    }

    /**
     * @returns {number}
     */
    _count() {
        return this._thumbs().length || this._dots().length || this._slides().length
    }

    /**
     * @param {HTMLElement} el
     * @param {string} name
     * @returns {number}
     */
    _optionIndex(el, name) {
        const instance = getInstanceByElement(name, el)
        if (instance?.options?.index != null) {
            return Number(instance.options.index)
        }

        try {
            const raw = el.getAttribute('data-component-options')
            return Number(JSON.parse(raw || '{}').index)
        } catch {
            return -1
        }
    }

    /**
     * @param {HTMLElement} el
     * @returns {'prev'|'next'|string}
     */
    _optionDirection(el) {
        const name = this.options.controlComponent
        const instance = getInstanceByElement(name, el)
        if (instance?.options?.direction) {
            return String(instance.options.direction)
        }

        try {
            const raw = el.getAttribute('data-component-options')
            return String(JSON.parse(raw || '{}').direction || 'next')
        } catch {
            return 'next'
        }
    }

    /**
     * @returns {import('./Gallery/Canvas.js').default|null}
     */
    _canvas() {
        const name = this.options.canvasComponent
        const el = this.el.querySelector(`[data-component="${name}"]`)
        return getInstanceByElement(name, el)
    }

    /**
     * @returns {import('./Gallery/Thumbnails.js').default|null}
     */
    _thumbnails() {
        const name = this.options.thumbnailsComponent
        const el = this.el.querySelector(`[data-component="${name}"]`)
        return getInstanceByElement(name, el)
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

    /**
     * @returns {HTMLElement[]}
     */
    _dots() {
        return Array.from(
            this.el.querySelectorAll(
                `[data-component="${this.options.dotComponent}"]`,
            ),
        )
    }

    /**
     * @returns {HTMLElement[]}
     */
    _controls() {
        return Array.from(
            this.el.querySelectorAll(
                `[data-component="${this.options.controlComponent}"]`,
            ),
        )
    }

    /**
     * @returns {HTMLElement[]}
     */
    _slides() {
        return Array.from(
            this.el.querySelectorAll(
                '[data-component="ViewsTheme:Gallery:Slide"]',
            ),
        )
    }
}
