import {
    abortRequest,
    beginRequest,
    fetchText,
} from '@views-theme/modules/shared/http.js'
import { parseHtmlFragment } from '@views-theme/modules/shared/dom.js'

/**
 * Cart drawer body: first fill of the pending shell, then in-open island refresh.
 *
 * @extends {ShopwareComponent}
 */
export default class CartDrawerBody extends ShopwareComponent {
    static options = {
        drawerUrl: null,
        changedEvent: 'ViewsTheme:Cart:Changed',
        flashesComponent: 'ViewsTheme:Cart:Flashes',
        headingComponent: 'ViewsTheme:Cart:Drawer:Heading',
        itemsComponent: 'ViewsTheme:Cart:Items',
        shippingComponent: 'ViewsTheme:Cart:Shipping',
        footerComponent: 'ViewsTheme:Cart:Drawer:Footer',
        drawerSelector: '#vi-cart-drawer',
        bodyComponent: 'ViewsTheme:Cart:Drawer:Body',
        /** Rendered without cart data (loader only): fetch and fill on init */
        pending: false,
    }

    init() {
        this._busy = false
        this._queued = false
        this._fetch = { controller: null, seq: 0 }
        this._pending = this.options.pending === true
        this._onCartChanged = this._onCartChanged.bind(this)
        this._drawerEl = this.el.closest(this.options.drawerSelector) || document.querySelector(this.options.drawerSelector)
        this._alertEl = this.el.querySelector(':scope > [role="alert"]')

        window.Shopware.on(this.options.changedEvent, this._onCartChanged)

        if (this._pending) {
            void this._refresh()
        }
    }

    destroy() {
        window.Shopware.off(this.options.changedEvent, this._onCartChanged)
        abortRequest(this._fetch)
        this._queued = false
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
            if (this._pending && this._alertEl) {
                // Drop the loader; the next Cart:Changed retries the first fill
                this.el.replaceChildren(this._alertEl)
            }
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
        if (this._pending) {
            this._fill(source)
            this._swap(source, this._drawerEl || document, this.options.headingComponent)
            return
        }

        this._swap(source, this.el, this.options.flashesComponent)
        this._swap(source, this.el, this.options.itemsComponent)
        this._swap(source, this.el, this.options.shippingComponent, this.options.footerComponent)
        this._swap(source, this.el, this.options.footerComponent)
        this._swap(source, this._drawerEl || document, this.options.headingComponent)
    }

    /**
     * First fill: take every child of the response body (loader out, islands in, server order kept).
     *
     * @param {ParentNode} source
     */
    _fill(source) {
        const next = source.querySelector(`[data-component="${this.options.bodyComponent}"]`)
        if (!next) {
            throw new Error('CartDrawerBody: response has no drawer body')
        }

        this.el.replaceChildren(...next.childNodes)
        this._alertEl = this.el.querySelector(':scope > [role="alert"]')
        this._pending = false
    }

    /**
     * @param {ParentNode} sourceRoot
     * @param {ParentNode} targetRoot
     * @param {string} componentName
     * @param {string} [beforeComponentName] insert a newly present island before this one
     */
    _swap(sourceRoot, targetRoot, componentName, beforeComponentName) {
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
            const anchor = beforeComponentName
                ? targetRoot.querySelector(`[data-component="${beforeComponentName}"]`)
                : null
            targetRoot.insertBefore(next, anchor)
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
