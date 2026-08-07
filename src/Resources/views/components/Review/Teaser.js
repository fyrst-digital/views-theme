/**
 * Review write/edit teaser — toggles Panel form mode.
 *
 * @extends {ShopwareComponent}
 */
export default class ReviewTeaser extends ShopwareComponent {
    static options = {
        panelComponent: 'ViewsTheme:Review:Panel',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
        this._syncButtons()
        window.Shopware.on('ViewsTheme:Review:Mode', this._onMode = this._onMode.bind(this))
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        if (this._onMode) {
            window.Shopware.off('ViewsTheme:Review:Mode', this._onMode)
        }
    }

    /**
     * @param {MouseEvent} event
     */
    _onClick(event) {
        const target = event.target instanceof Element
            ? event.target.closest('[data-review-teaser-action]')
            : null
        if (!target || !this.el.contains(target)) {
            return
        }

        const action = target.getAttribute('data-review-teaser-action')
        if (action === 'open') {
            window.Shopware.callMethod(this.options.panelComponent, 'openForm')
            this._setOpen(true)
            return
        }
        if (action === 'close') {
            window.Shopware.callMethod(this.options.panelComponent, 'closeForm')
            this._setOpen(false)
        }
    }

    /**
     * @param {{ mode?: string, source?: Element }} payload
     */
    _onMode(payload) {
        const panel = this.el.closest(`[data-component="${this.options.panelComponent}"]`)
        if (payload?.source && panel && payload.source !== panel) {
            return
        }
        this._setOpen(payload?.mode === 'form')
    }

    _syncButtons() {
        const panel = this.el.closest(`[data-component="${this.options.panelComponent}"]`)
        const mode = panel?.getAttribute('data-review-mode') || 'list'
        this._setOpen(mode === 'form')
    }

    /**
     * @param {boolean} open
     */
    _setOpen(open) {
        const openBtn = this.el.querySelector('[data-review-teaser-action="open"]')
        const closeBtn = this.el.querySelector('[data-review-teaser-action="close"]')
        if (openBtn instanceof HTMLElement) {
            openBtn.hidden = open
        }
        if (closeBtn instanceof HTMLElement) {
            closeBtn.hidden = !open
        }
    }
}
