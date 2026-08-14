import {
    abortRequest,
    beginRequest,
    fetchText,
} from '@views-theme/modules/shared/http.js'
import { parseHtmlFragment } from '@views-theme/modules/shared/dom.js'

/**
 * Cart page owner: island refresh on Cart:Changed.
 *
 * @extends {ShopwareComponent}
 */
export default class CartPage extends ShopwareComponent {
    static options = {
        pageUrl: null,
        changedEvent: 'ViewsTheme:Cart:Changed',
        flashesComponent: 'ViewsTheme:Cart:Flashes',
        headingComponent: 'ViewsTheme:Cart:Heading',
        itemsComponent: 'ViewsTheme:Cart:Items',
        asideComponent: 'ViewsTheme:Cart:Page:Aside',
    }

    init() {
        this._busy = false
        this._queued = false
        this._fetch = { controller: null, seq: 0 }
        this._onCartChanged = this._onCartChanged.bind(this)
        this._alertEl = this.el.querySelector(':scope > [role="alert"]')

        window.Shopware.on(this.options.changedEvent, this._onCartChanged)
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onCartChanged)
        abortRequest(this._fetch)
        this._queued = false
    }

    _bodyEl() {
        return this.el.querySelector('[data-cart-page-body]') || this.el
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

        if (!this.options.pageUrl) {
            return
        }

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            do {
                this._queued = false
                const request = beginRequest(this._fetch)
                const html = await fetchText(this.options.pageUrl, { signal: request.signal })
                if (!request.isCurrent()) {
                    continue
                }
                this._apply(html)
            } while (this._queued)
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('CartPage: Failed to refresh cart page', error)
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
        this._swap(source, this.el, this.options.flashesComponent)
        this._swap(source, this.el, this.options.headingComponent)
        this._swap(source, this.el, this.options.itemsComponent)
        this._swap(source, this._bodyEl(), this.options.asideComponent)
    }

    /**
     * @param {ParentNode} sourceRoot
     * @param {ParentNode} targetRoot
     * @param {string} componentName
     */
    _swap(sourceRoot, targetRoot, componentName) {
        if (!targetRoot) {
            return
        }

        const next = sourceRoot.querySelector(`[data-component="${componentName}"]`)
        const existing = targetRoot.querySelector(`[data-component="${componentName}"]`)

        if (existing && next) {
            existing.replaceWith(next)
            return
        }

        if (existing && !next) {
            existing.remove()
            return
        }

        if (!existing && next) {
            targetRoot.appendChild(next)
        }
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
