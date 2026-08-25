import { parseHtmlRoot } from '@views-theme/modules/shared/dom.js'
import { getInstanceByElement } from '@views-theme/modules/shared/component.js'
import {
    abortRequest,
    beginRequest,
    fetchText,
} from '@views-theme/modules/shared/http.js'

/**
 * Address picker / editor owner inside Modal.
 *
 * @extends {ShopwareComponent}
 */
export default class AddressManager extends ShopwareComponent {
    static options = {
        managerUrl: null,
        editorUrl: null,
        switchUrl: null,
        defaultUrl: null,
        tab: 'shipping',
        hideShipping: false,
        viewComponent: 'ViewsTheme:Address:Manager:View',
        handlerComponent: 'ViewsTheme:Form:Handler',
        submitEvent: 'ViewsTheme:Form:Handler:Submit',
        tabsChangeEvent: 'ViewsTheme:Tabs:Change',
        editorFormId: 'vi-address-editor',
        switchFormId: 'vi-address-manager-switch',
        shippingTabId: 'vi-address-tab-shipping',
        billingTabId: 'vi-address-tab-billing',
        shippingIdName: 'shippingAddressId',
        billingIdName: 'billingAddressId',
    }

    init() {
        this._tab = this.options.tab === 'billing' ? 'billing' : 'shipping'
        this._fetch = { controller: null, seq: 0 }
        this._onSubmit = this._onSubmit.bind(this)
        this._onTabsChange = this._onTabsChange.bind(this)

        window.Shopware.on(this.options.submitEvent, this._onSubmit)
        window.Shopware.on(this.options.tabsChangeEvent, this._onTabsChange)
    }

    destroy() {
        window.Shopware.off(this.options.submitEvent, this._onSubmit)
        window.Shopware.off(this.options.tabsChangeEvent, this._onTabsChange)
        abortRequest(this._fetch)
    }

    /**
     * @param {string} id
     * @param {string} type
     */
    select(id, type) {
        if (!id || (type !== 'shipping' && type !== 'billing')) {
            return
        }

        const form = this._switchForm()
        const name = type === 'shipping'
            ? this.options.shippingIdName
            : this.options.billingIdName
        const input = form?.elements?.namedItem(name)
        if (input instanceof HTMLInputElement) {
            input.value = id
        }

        const radio = this.el.querySelector(
            `input[type="radio"][name="${type}"][value="${CSS.escape(id)}"]`,
        )
        if (radio instanceof HTMLInputElement && !radio.disabled) {
            radio.checked = true
        }
    }

    /**
     * @param {string} [type]
     */
    openCreate(type) {
        void this._loadEditor({ type: type || this._tab })
    }

    /**
     * @param {string} id
     * @param {string} [type]
     */
    openEdit(id, type) {
        void this._loadEditor({ type: type || this._tab, addressId: id })
    }

    backToList() {
        void this._loadList()
    }

    /**
     * @param {string} id
     * @param {string} type
     */
    async setDefault(id, type) {
        if (!this.options.defaultUrl || !id) {
            return
        }

        const request = beginRequest(this._fetch)

        try {
            const response = await this._request(this.options.defaultUrl, {
                method: 'POST',
                body: JSON.stringify({ id, type }),
                headers: { 'Content-Type': 'application/json' },
                redirect: 'manual',
                signal: request.signal,
            })
            if (!request.isCurrent()) {
                return
            }
            // Core createActionResponse 302s to the old widget. redirect:manual
            // yields opaqueredirect / status 0 — same success check as Cart._post.
            if (!response.ok && response.type !== 'opaqueredirect' && response.status !== 0) {
                throw new Error(`Fetch failed: ${response.status}`)
            }
            await this._loadList()
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('AddressManager: Failed to set default address', error)
        }
    }

    /**
     * @param {{ el?: Element, form?: HTMLFormElement }} payload
     */
    async _onSubmit(payload) {
        const form = payload?.form || payload?.el
        if (!(form instanceof HTMLFormElement) || !this.el.contains(form)) {
            return
        }

        const handler = getInstanceByElement(this.options.handlerComponent, form)

        if (form.id === this.options.switchFormId) {
            await this._submitSwitch(form, handler)
            return
        }

        if (form.id === this.options.editorFormId) {
            await this._submitEditor(form, handler)
        }
    }

    /**
     * @param {{ el?: Element, tabId?: string }} payload
     */
    _onTabsChange(payload) {
        if (!payload?.el || !this.el.contains(payload.el)) {
            return
        }

        if (payload.tabId === this.options.billingTabId) {
            this._tab = 'billing'
            return
        }

        if (payload.tabId === this.options.shippingTabId) {
            this._tab = 'shipping'
        }
    }

    /**
     * @param {HTMLFormElement} form
     * @param {object|null} handler
     */
    async _submitSwitch(form, handler) {
        const request = beginRequest(this._fetch)

        try {
            const response = await this._request(form.action, {
                method: 'POST',
                body: new FormData(form),
                signal: request.signal,
            })
            if (!request.isCurrent()) {
                return
            }
            if (response.status === 204) {
                window.location.reload()
                return
            }
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('AddressManager: Failed to switch address', error)
        } finally {
            handler?.setSubmitting?.(false)
        }
    }

    /**
     * @param {HTMLFormElement} form
     * @param {object|null} handler
     */
    async _submitEditor(form, handler) {
        const request = beginRequest(this._fetch)

        try {
            const response = await this._request(form.action, {
                method: 'POST',
                body: new FormData(form),
                signal: request.signal,
            })
            if (!request.isCurrent()) {
                return
            }
            if (response.status === 204) {
                window.location.reload()
                return
            }

            const text = await response.text()
            if (!request.isCurrent()) {
                return
            }

            if (response.ok || (response.status >= 400 && response.status < 500)) {
                this._swapView(text)
                return
            }

            throw new Error(`Fetch failed: ${response.status}`)
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('AddressManager: Failed to save address', error)
        } finally {
            if (handler?.el && document.contains(handler.el)) {
                handler.setSubmitting(false)
            }
        }
    }

    /**
     * @param {{ type: string, addressId?: string }} params
     */
    async _loadEditor(params) {
        if (!this.options.editorUrl) {
            return
        }

        const url = new URL(this.options.editorUrl, window.location.origin)
        url.searchParams.set('type', params.type)
        if (params.addressId) {
            url.searchParams.set('addressId', params.addressId)
        }

        await this._fetchAndSwap(url.toString())
    }

    async _loadList() {
        if (!this.options.managerUrl) {
            return
        }

        const url = new URL(this.options.managerUrl, window.location.origin)
        url.searchParams.set('tab', this._tab)
        if (this.options.hideShipping) {
            url.searchParams.set('hideShipping', '1')
        }

        await this._fetchAndSwap(url.toString())
    }

    /**
     * @param {string} url
     */
    async _fetchAndSwap(url) {
        const request = beginRequest(this._fetch)

        try {
            const html = await fetchText(url, { signal: request.signal })
            if (!request.isCurrent()) {
                return
            }
            this._swapView(html)
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }
            console.error('AddressManager: Failed to load view', error)
        }
    }

    /**
     * @param {string} html
     */
    _swapView(html) {
        const next = parseHtmlRoot(html)
        if (!next) {
            return
        }

        const name = this.options.viewComponent
        const island = next.matches(`[data-component="${name}"]`)
            ? next
            : next.querySelector(`[data-component="${name}"]`)
        const existing = this.el.querySelector(`[data-component="${name}"]`)

        if (existing && island) {
            existing.replaceWith(island)
        }
    }

    /**
     * @param {string} url
     * @param {RequestInit} [init]
     * @returns {Promise<Response>}
     */
    _request(url, init = {}) {
        return fetch(url, {
            method: init.method || 'GET',
            body: init.body,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                ...(init.headers || {}),
            },
            signal: init.signal,
            redirect: init.redirect || 'follow',
        })
    }

    /**
     * @returns {HTMLFormElement|null}
     */
    _switchForm() {
        const form = this.el.querySelector(`#${this.options.switchFormId}`)
        return form instanceof HTMLFormElement ? form : null
    }
}
