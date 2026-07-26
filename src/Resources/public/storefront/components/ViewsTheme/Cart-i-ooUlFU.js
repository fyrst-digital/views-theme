var e=class extends ShopwareComponent {
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
        this._busy = false
        this._queued = null
        this._onAdd = this._onAdd.bind(this)
        this._onRemove = this._onRemove.bind(this)
        this._onUpdate = this._onUpdate.bind(this)
        this._onPromote = this._onPromote.bind(this)
        this._onConfigure = this._onConfigure.bind(this)
        this._onAddToCartWithoutOffcanvas = this._onAddToCartWithoutOffcanvas.bind(this)

        window.openOffcanvasAfterAddToCart = '0'

        window.Shopware.on(this.options.addEvent, this._onAdd)
        window.Shopware.on(this.options.removeEvent, this._onRemove)
        window.Shopware.on(this.options.updateEvent, this._onUpdate)
        window.Shopware.on(this.options.promoteEvent, this._onPromote)
        window.Shopware.on(this.options.configureEvent, this._onConfigure)

        this._subscribeAddToCartPlugins()
    }

    destroy() {
        window.Shopware.off(this.options.addEvent, this._onAdd)
        window.Shopware.off(this.options.removeEvent, this._onRemove)
        window.Shopware.off(this.options.updateEvent, this._onUpdate)
        window.Shopware.off(this.options.promoteEvent, this._onPromote)
        window.Shopware.off(this.options.configureEvent, this._onConfigure)

        this._unsubscribeAddToCartPlugins()
        this._queued = null
    }

    _onAdd(payload) {
        this._enqueue('add', async () => {
            const formData = payload?.formData instanceof FormData
                ? payload.formData
                : this._buildAddFormData(payload)

            await this._post(this.options.addPath, formData)
        }, payload)
    }

    _onRemove(payload) {
        this._enqueue('remove', async () => {
            const id = payload?.lineItemId
            if (!id) {
                throw new Error('lineItemId is required')
            }

            const formData = new FormData()
            formData.append('redirectTo', '')
            await this._post(this._urlWithId(this.options.deletePath, id), formData)
        }, payload)
    }

    _onUpdate(payload) {
        this._enqueue('update', async () => {
            const id = payload?.lineItemId
            const quantity = payload?.quantity
            if (!id || quantity == null) {
                throw new Error('lineItemId and quantity are required')
            }

            const formData = new FormData()
            formData.append('quantity', String(quantity))
            formData.append('redirectTo', '')
            await this._post(this._urlWithId(this.options.changeQuantityPath, id), formData)
        }, payload)
    }

    _onPromote(payload) {
        this._enqueue('promote', async () => {
            const formData = payload?.formData instanceof FormData
                ? payload.formData
                : (() => {
                    const data = new FormData()
                    data.append('code', payload?.code || '')
                    data.append('redirectTo', '')
                    return data
                })()

            await this._post(this.options.promotePath, formData)
        }, payload)
    }

    _onConfigure(payload) {
        this._enqueue('configure', async () => {
            const formData = payload?.formData instanceof FormData
                ? payload.formData
                : new FormData()

            if (!formData.has('redirectTo')) {
                formData.append('redirectTo', '')
            }

            await this._post(this.options.configurePath, formData)
        }, payload)
    }

    async _onAddToCartWithoutOffcanvas() {
        await this._emitChanged({ ok: true, action: 'add', source: 'AddToCart' })
    }

    _enqueue(action, runner, payload = {}) {
        if (this._busy) {
            this._queued = { action, runner, payload }
            return
        }

        void this._run(action, runner, payload)
    }

    async _run(action, runner, payload = {}) {
        this._busy = true

        try {
            await runner()
            await this._emitChanged({
                ok: true,
                action,
                source: payload?.source || null,
            })
        } catch (error) {
            console.error(`Cart: ${action} failed`, error)
            await this._emitChanged({
                ok: false,
                action,
                error: error?.message || null,
                source: payload?.source || null,
            })
        } finally {
            this._busy = false
            const next = this._queued
            this._queued = null
            if (next) {
                void this._run(next.action, next.runner, next.payload)
            }
        }
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

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })

        if (!response.ok) {
            throw new Error(`Cart mutation failed: ${response.status}`)
        }

        return response
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

        formData.append('redirectTo', '')
        return formData
    }

    _subscribeAddToCartPlugins() {
        this._addToCartSubscriptions = []
        const pluginManager = window.PluginManager
        if (!pluginManager || typeof pluginManager.getPluginInstances !== 'function') {
            return
        }

        const instances = pluginManager.getPluginInstances('AddToCart')
        if (!instances) {
            return
        }

        instances.forEach((instance) => {
            if (!instance?.$emitter) {
                return
            }

            instance.$emitter.subscribe('addToCartWithoutOffcanvas', this._onAddToCartWithoutOffcanvas)
            this._addToCartSubscriptions.push({
                emitter: instance.$emitter,
                eventName: 'addToCartWithoutOffcanvas',
                callback: this._onAddToCartWithoutOffcanvas,
            })
        })
    }

    _unsubscribeAddToCartPlugins() {
        if (!this._addToCartSubscriptions) {
            return
        }

        this._addToCartSubscriptions.forEach(({ emitter, eventName, callback }) => {
            if (emitter && typeof emitter.unsubscribe === 'function') {
                emitter.unsubscribe(eventName, callback)
            }
        })
        this._addToCartSubscriptions = []
    }
}
export{e as default};
