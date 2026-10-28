import {
    abortRequest,
    beginRequest,
    fetchText,
} from '@views-theme/modules/shared/http.js'
import { parseHtmlFragment, swapComponentIsland } from '@views-theme/modules/shared/dom.js'
import { shell } from '@views-theme/modules/shared/shell-registry.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * In-open cart drawer island refresh.
 *
 * @extends {ThemeComponent}
 */
export default class CartDrawerBody extends ThemeComponent {
    static options = {
        drawerUrl: null,
        changedEvent: 'ViewsTheme:Cart:Changed',
        flashesComponent: 'ViewsTheme:Cart:Flashes',
        headingComponent: 'ViewsTheme:Cart:Drawer:Heading',
        itemsComponent: 'ViewsTheme:Cart:Items',
        shippingComponent: 'ViewsTheme:Cart:Shipping',
        footerComponent: 'ViewsTheme:Cart:Drawer:Footer',
        shellId: 'vi-cart-drawer',
    }

    init() {
        this._busy = false
        this._queued = false
        this._fetch = { controller: null, seq: 0 }
        this._onCartChanged = this._onCartChanged.bind(this)
        this._alertEl = this.el.querySelector(':scope > [role="alert"]')

        this.scope.bus(this.options.changedEvent, this._onCartChanged)
    }

    destroy() {
        abortRequest(this._fetch)
        this._queued = false

        super.destroy()
    }

    async _onCartChanged(payload) {
        if (!payload || payload.ok === false) {
            this._showError(payload?.error)
            return
        }

        this._clearError()
        await this._refresh()
    }

    async _refresh() {
        if (this._busy) {
            this._queued = true
            return
        }

        if (!this.options.drawerUrl) {
            return
        }

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            do {
                this._queued = false
                const request = beginRequest(this._fetch)
                const html = await fetchText(this.options.drawerUrl, { signal: request.signal })
                if (!request.isCurrent()) {
                    continue
                }
                this._apply(html)
            } while (this._queued)
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('CartDrawerBody: Failed to refresh cart drawer', error)
            this._showError(null)
        } finally {
            this._busy = false
            this.el.removeAttribute('aria-busy')
        }
    }

    /**
     * @param {string} html
     */
    _apply(html) {
        const source = parseHtmlFragment(html)
        swapComponentIsland(source, this.el, this.options.flashesComponent)
        swapComponentIsland(source, this.el, this.options.itemsComponent)
        swapComponentIsland(source, this.el, this.options.shippingComponent, this.options.footerComponent)
        swapComponentIsland(source, this.el, this.options.footerComponent)
        swapComponentIsland(source, shell(this.options.shellId).el || document, this.options.headingComponent)
    }

    _showError(message) {
        if (!this._alertEl) {
            return
        }

        this._alertEl.hidden = false
        this._alertEl.textContent = message || this._alertEl.dataset.fallback || ''
    }

    _clearError() {
        if (!this._alertEl) {
            return
        }

        this._alertEl.hidden = true
        this._alertEl.textContent = ''
    }
}
