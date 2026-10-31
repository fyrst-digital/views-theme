/**
 * Count pill that follows a bus event. Hidden at 0.
 *
 * `countKey` names the `window` property that holds the current count (read on mount, kept in sync on change).
 * `liveId` optionally names an `aria-live` element that announces the count (`liveText` with `%counter%`).
 *
 * @extends {ShopwareComponent}
 */
export default class Count extends ShopwareComponent {
    static options = {
        changedEvent: null,
        countKey: null,
        liveId: null,
        liveText: '%counter%',
    }

    init() {
        this._onChanged = this._onChanged.bind(this)

        if (this.options.changedEvent) {
            window.Shopware.on(this.options.changedEvent, this._onChanged)
        }

        this._render(this.options.countKey ? window[this.options.countKey] || 0 : 0)
    }

    destroy() {
        if (this.options.changedEvent) {
            window.Shopware.off(this.options.changedEvent, this._onChanged)
        }
    }

    _onChanged(payload) {
        if (!payload || typeof payload.count !== 'number') {
            return
        }

        if (this.options.countKey) {
            window[this.options.countKey] = payload.count
        }

        this._render(payload.count)
    }

    _render(count) {
        if (count > 0) {
            this.el.hidden = false
            this.el.textContent = String(count)
        } else {
            this.el.hidden = true
            this.el.textContent = ''
        }

        this._updateLiveArea(count)
    }

    _updateLiveArea(count) {
        if (!this.options.liveId) {
            return
        }

        const live = document.getElementById(this.options.liveId)
        if (!live) {
            return
        }

        live.textContent = (this.options.liveText || '%counter%').replace('%counter%', String(count || 0))
    }
}
