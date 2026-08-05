import { createSerialQueue } from '../../app/storefront/src/views-theme/serial-queue.js'

export default class Wishlist extends ShopwareComponent {
    static options = {
        listPath: null,
        mergePath: null,
        addPath: null,
        removePath: null,
        loggedIn: false,
        placeholderId: '00000000000000000000000000000000',
        storageKeyPrefix: 'wishlist-',
        cookieName: 'wishlist-enabled',
        toggleEvent: 'ViewsTheme:Wishlist:Toggle',
        changedEvent: 'ViewsTheme:Wishlist:Changed',
    }

    init() {
        this._products = {}
        this._queue = createSerialQueue({
            coalesceKey: (job) => {
                const id = job?.payload?.productId
                return id ? String(id) : null
            },
        })
        this._onToggle = this._onToggle.bind(this)

        window.Shopware.on(this.options.toggleEvent, this._onToggle)
        void this._bootstrap()
    }

    destroy() {
        window.Shopware.off(this.options.toggleEvent, this._onToggle)
        this._queue?.clear()
    }

    _onToggle(payload) {
        const productId = payload?.productId
        if (!productId) {
            return
        }

        void this._enqueue(this._has(productId) ? 'remove' : 'add', async () => {
            if (this._has(productId)) {
                await this._remove(productId)
            } else {
                await this._add(productId)
            }
        }, payload)
    }

    async _bootstrap() {
        try {
            if (this.options.loggedIn) {
                await this._mergeGuestIfNeeded()
                await this._loadRemote()
            } else {
                this._products = this._readLocal()
            }

            this._emitChanged({
                ok: true,
                action: 'load',
            })
        } catch (error) {
            console.error('Wishlist: load failed', error)
            this._emitChanged({
                ok: false,
                action: 'load',
                error: error?.message || null,
            })
        }
    }

    async _enqueue(action, runner, payload = {}) {
        await this._queue.enqueue({ action, runner, payload }, async (job) => {
            try {
                await job.runner()
                this._emitChanged({
                    ok: true,
                    action: job.action,
                    productId: job.payload?.productId || null,
                    source: job.payload?.source || null,
                })
            } catch (error) {
                if (error?.code !== 'consent') {
                    console.error(`Wishlist: ${job.action} failed`, error)
                }
                this._emitChanged({
                    ok: false,
                    action: job.action,
                    productId: job.payload?.productId || null,
                    error: error?.message || null,
                    source: job.payload?.source || null,
                })
            }
        })
    }

    async _add(productId) {
        if (!this._consentAllowsGuest()) {
            this._requestConsent()
            const err = new Error('Wishlist cookie consent required')
            err.code = 'consent'
            throw err
        }

        if (this.options.loggedIn) {
            const ok = await this._postJson(this._urlWithId(this.options.addPath, productId))
            if (!ok) {
                throw new Error('Unable to add product to wishlist')
            }
        }

        this._products[productId] = new Date().toISOString()
        if (!this.options.loggedIn) {
            this._writeLocal()
        }
    }

    async _remove(productId) {
        if (this.options.loggedIn) {
            const ok = await this._postJson(this._urlWithId(this.options.removePath, productId))
            if (!ok) {
                throw new Error('Unable to remove product from wishlist')
            }
        }

        delete this._products[productId]
        if (!this.options.loggedIn) {
            this._writeLocal()
        }
    }

    async _loadRemote() {
        if (!this.options.listPath) {
            this._products = {}
            return
        }

        const response = await fetch(this.options.listPath, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })

        if (!response.ok) {
            throw new Error(`Wishlist list failed: ${response.status}`)
        }

        const data = await response.json()
        this._products = this._normalizeProducts(data)
    }

    async _mergeGuestIfNeeded() {
        const guest = this._readLocal()
        const ids = Object.keys(guest)
        if (!ids.length || !this.options.mergePath) {
            return
        }

        const response = await fetch(this.options.mergePath, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productIds: ids }),
        })

        if (response.ok) {
            this._clearLocal()
        }
    }

    async _postJson(url) {
        if (!url) {
            throw new Error('Wishlist mutation URL is missing')
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            return false
        }

        const data = await response.json()
        return data?.success !== false
    }

    _emitChanged({ ok, action, productId = null, error = null, source = null }) {
        const products = { ...this._products }
        const count = Object.keys(products).length
        window.wishlistCount = count
        window.wishlistProducts = products

        window.Shopware.emitQueued(this.options.changedEvent, {
            ok,
            count,
            action,
            productId,
            products,
            error,
            source,
        })
    }

    _has(productId) {
        return !!this._products[productId]
    }

    _normalizeProducts(data) {
        if (!data) {
            return {}
        }

        if (Array.isArray(data)) {
            const products = {}
            data.forEach((id) => {
                if (id) {
                    products[id] = true
                }
            })
            return products
        }

        if (typeof data === 'object') {
            return { ...data }
        }

        return {}
    }

    _storageKey() {
        return `${this.options.storageKeyPrefix}${window.salesChannelId || ''}`
    }

    _readLocal() {
        if (!this._consentAllowsGuest()) {
            this._clearLocal()
            return {}
        }

        try {
            const raw = window.localStorage.getItem(this._storageKey())
            if (!raw) {
                return {}
            }

            const parsed = JSON.parse(raw)
            return parsed instanceof Object && !Array.isArray(parsed) ? parsed : {}
        } catch {
            return {}
        }
    }

    _writeLocal() {
        const key = this._storageKey()
        const count = Object.keys(this._products).length

        if (!count) {
            window.localStorage.removeItem(key)
            return
        }

        window.localStorage.setItem(key, JSON.stringify(this._products))
    }

    _clearLocal() {
        window.localStorage.removeItem(this._storageKey())
    }

    _consentAllowsGuest() {
        if (this.options.loggedIn) {
            return true
        }

        if (!window.useDefaultCookieConsent) {
            return true
        }

        return this._getCookie(this.options.cookieName) !== null
    }

    _requestConsent() {
        if (!window.useDefaultCookieConsent || !document.$emitter) {
            return
        }

        const routeBase = window.router?.['frontend.cookie.consent.offcanvas'] || ''
        document.$emitter.publish('CookieConfiguration/requestConsent', {
            route: `${routeBase}?featureName=wishlist&cookieName=${this.options.cookieName}`,
            cookieName: this.options.cookieName,
        })
    }

    _getCookie(name) {
        const prefix = `${name}=`
        const match = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix))
        return match ? match.slice(prefix.length) : null
    }

    _urlWithId(template, id) {
        if (!template) {
            return null
        }

        return template.replace(this.options.placeholderId, id)
    }
}
