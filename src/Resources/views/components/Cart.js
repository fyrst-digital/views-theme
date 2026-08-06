import { createSerialQueue } from '@views-theme/modules/serial-queue.js'

export default class Cart extends ShopwareComponent {
    static options = {
        cartJsonUrl: null,
        changeQuantityPath: null,
        deletePath: null,
        addPath: null,
        promotePath: null,
        configurePath: null,
        addEvent: 'ViewsTheme:Cart:Add',
        removeEvent: 'ViewsTheme:Cart:Remove',
        updateEvent: 'ViewsTheme:Cart:Update',
        promoteEvent: 'ViewsTheme:Cart:Promote',
        configureEvent: 'ViewsTheme:Cart:Configure',
        changedEvent: 'ViewsTheme:Cart:Changed',
        placeholderId: '00000000000000000000000000000000',
        drawerSelector: '#vi-cart-drawer',
        cartPageSelector: '.is-active-route-frontend-checkout-cart-page, .is-ctl-checkout.is-act-cartpage',
    }

    init() {
        this._queue = createSerialQueue({
            coalesceKey: (job) => {
                const id = job?.payload?.lineItemId
                return id ? `${job.action}:${id}` : null
            },
        })
        this._onAdd = this._onAdd.bind(this)
        this._onRemove = this._onRemove.bind(this)
        this._onUpdate = this._onUpdate.bind(this)
        this._onPromote = this._onPromote.bind(this)
        this._onConfigure = this._onConfigure.bind(this)

        window.Shopware.on(this.options.addEvent, this._onAdd)
        window.Shopware.on(this.options.removeEvent, this._onRemove)
        window.Shopware.on(this.options.updateEvent, this._onUpdate)
        window.Shopware.on(this.options.promoteEvent, this._onPromote)
        window.Shopware.on(this.options.configureEvent, this._onConfigure)
    }

    destroy() {
        window.Shopware.off(this.options.addEvent, this._onAdd)
        window.Shopware.off(this.options.removeEvent, this._onRemove)
        window.Shopware.off(this.options.updateEvent, this._onUpdate)
        window.Shopware.off(this.options.promoteEvent, this._onPromote)
        window.Shopware.off(this.options.configureEvent, this._onConfigure)

        this._queue?.clear()
    }

    _onAdd(payload) {
        void this._enqueue('add', async () => {
            const formData = payload?.formData instanceof FormData
                ? this._forAjax(payload.formData)
                : this._buildAddFormData(payload)

            await this._post(this.options.addPath, formData)
        }, payload)
    }

    _onRemove(payload) {
        void this._enqueue('remove', async () => {
            const id = payload?.lineItemId
            if (!id) {
                throw new Error('lineItemId is required')
            }

            const formData = new FormData()
            await this._post(this._urlWithId(this.options.deletePath, id), formData)
        }, payload)
    }

    _onUpdate(payload) {
        void this._enqueue('update', async () => {
            const id = payload?.lineItemId
            const quantity = payload?.quantity
            if (!id || quantity == null) {
                throw new Error('lineItemId and quantity are required')
            }

            const formData = new FormData()
            formData.append('quantity', String(quantity))
            await this._post(this._urlWithId(this.options.changeQuantityPath, id), formData)
        }, payload)
    }

    _onPromote(payload) {
        void this._enqueue('promote', async () => {
            const formData = payload?.formData instanceof FormData
                ? this._forAjax(payload.formData)
                : (() => {
                    const data = new FormData()
                    data.append('code', payload?.code || '')
                    return data
                })()

            await this._post(this.options.promotePath, formData)
        }, payload)
    }

    _onConfigure(payload) {
        void this._enqueue('configure', async () => {
            const formData = payload?.formData instanceof FormData
                ? this._forAjax(payload.formData)
                : new FormData()

            await this._post(this.options.configurePath, formData)
        }, payload)
    }

    async _enqueue(action, runner, payload = {}) {
        await this._queue.enqueue({ action, runner, payload }, async (job) => {
            try {
                await job.runner()
                await this._emitChanged({
                    ok: true,
                    action: job.action,
                    source: job.payload?.source || null,
                })
            } catch (error) {
                console.error(`Cart: ${job.action} failed`, error)
                await this._emitChanged({
                    ok: false,
                    action: job.action,
                    error: error?.message || null,
                    source: job.payload?.source || null,
                })
            }
        })
    }

    async _emitChanged({ ok, action, error = null, source = null }) {
        let count = window.cartCount || 0

        if (ok) {
            try {
                count = await this._fetchCartCount()
            } catch (fetchError) {
                console.error('Cart: Failed to refresh cart count', fetchError)
            }
        }

        window.cartCount = count

        window.Shopware.emitQueued(this.options.changedEvent, {
            ok,
            count,
            action,
            error,
            source,
        })

        if (ok) {
            this._reloadCartPageIfNeeded()
        }
    }

    _reloadCartPageIfNeeded() {
        if (document.querySelector(this.options.drawerSelector)) {
            return
        }

        if (!document.querySelector(this.options.cartPageSelector)) {
            return
        }

        window.location.reload()
    }

    async _fetchCartCount() {
        if (!this.options.cartJsonUrl) {
            return window.cartCount || 0
        }

        const response = await fetch(this.options.cartJsonUrl, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })

        if (!response.ok) {
            throw new Error(`Cart JSON fetch failed: ${response.status}`)
        }

        const data = await response.json()
        return data.lineItems ? data.lineItems.length : 0
    }

    async _post(url, formData) {
        if (!url) {
            throw new Error('Mutation URL is missing')
        }

        const body = formData instanceof FormData ? this._forAjax(formData) : formData

        const response = await fetch(url, {
            method: 'POST',
            body,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            redirect: 'manual',
        })

        // Empty redirectTo must be omitted so core returns 200.
        // redirect:manual also blocks following a 302 into a page route (403 XHR).
        if (!response.ok && response.type !== 'opaqueredirect' && response.status !== 0) {
            throw new Error(`Cart mutation failed: ${response.status}`)
        }

        return response
    }

    /**
     * Strip progressive-enhancement redirect fields so createActionResponse
     * returns an empty 200 instead of redirecting to a page (XHR → 403).
     */
    _forAjax(formData) {
        const data = formData instanceof FormData ? formData : new FormData()
        data.delete('redirectTo')
        data.delete('redirectParameters')
        data.delete('forwardTo')
        data.delete('forwardParameters')
        return data
    }

    _urlWithId(template, id) {
        if (!template) {
            return null
        }

        return template.replace(this.options.placeholderId, id)
    }

    _buildAddFormData(payload) {
        const formData = new FormData()
        const items = payload?.items || []

        items.forEach((item, index) => {
            const key = item.key || String(index)
            Object.entries(item).forEach(([field, value]) => {
                if (field === 'key' || value == null) {
                    return
                }
                formData.append(`lineItems[${key}][${field}]`, String(value))
            })
        })

        return formData
    }
}
