export default class ProductActionWishlist extends ShopwareComponent {
    static options = {
        productId: null,
        showText: false,
        texts: {
            add: 'Add to wishlist',
            remove: 'Remove from wishlist',
        },
        icons: {
            add: 'heart',
            remove: 'heart-fill',
        },
        toggleEvent: 'ViewsTheme:Wishlist:Toggle',
        changedEvent: 'ViewsTheme:Wishlist:Changed',
    }

    init() {
        this._pressed = false
        this._busy = false
        this._iconSuffix = undefined
        this._onClick = this._onClick.bind(this)
        this._onChanged = this._onChanged.bind(this)

        this.el.addEventListener('click', this._onClick)
        window.Shopware.on(this.options.changedEvent, this._onChanged)

        const known = window.wishlistProducts
        if (known && typeof known === 'object') {
            this._sync(!!known[this.options.productId])
        } else {
            this._sync(false)
        }
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        window.Shopware.off(this.options.changedEvent, this._onChanged)
    }

    _onClick(event) {
        event.preventDefault()
        event.stopPropagation()

        if (this._busy || !this.options.productId) {
            return
        }

        this._setBusy(true)
        window.Shopware.emit(this.options.toggleEvent, {
            productId: this.options.productId,
            source: this.el,
        })
    }

    _onChanged(payload) {
        if (!payload) {
            return
        }

        const productId = this.options.productId
        const isSource = payload.source === this.el
        const targetsThis = !payload.productId || payload.productId === productId

        if (isSource || payload.action === 'load') {
            this._setBusy(false)
        }

        if (!payload.ok && isSource) {
            return
        }

        if (!targetsThis && payload.action !== 'load') {
            return
        }

        const inList = this._inList(payload, productId)
        if (inList !== null) {
            this._sync(inList)
        }
    }

    _inList(payload, productId) {
        if (payload.products && typeof payload.products === 'object') {
            return !!payload.products[productId]
        }

        if (payload.productId === productId && payload.action === 'add') {
            return true
        }

        if (payload.productId === productId && payload.action === 'remove') {
            return false
        }

        return null
    }

    _sync(pressed) {
        this._pressed = !!pressed
        const text = this._pressed ? this.options.texts.remove : this.options.texts.add
        const iconName = this._pressed ? this.options.icons.remove : this.options.icons.add

        this.el.setAttribute('aria-pressed', this._pressed ? 'true' : 'false')
        this.el.setAttribute('aria-label', text)
        this.el.setAttribute('title', text)
        this._applyIcon(iconName)

        if (!this.options.showText) {
            return
        }

        for (const child of this.el.children) {
            if (child.tagName !== 'SPAN') {
                continue
            }

            if (child.classList.contains('icon') || child.querySelector('svg')) {
                continue
            }

            child.textContent = text
            break
        }
    }

    _applyIcon(name) {
        const el = this._iconEl()
        if (!el || !name) {
            return
        }

        if (this._iconSuffix === undefined) {
            this._captureSuffix(el)
        }

        const names = [this.options.icons.add, this.options.icons.remove].filter(Boolean)
        for (const n of names) {
            el.classList.remove(`icon-${n}`)
            if (this._iconSuffix) {
                el.classList.remove(`icon-${n}${this._iconSuffix}`)
            }
        }

        el.classList.add(this._iconNameClass(name))
    }

    _iconNameClass(name) {
        if (this._iconSuffix) {
            return `icon-${name}${this._iconSuffix}`
        }

        return `icon-${name}`
    }

    _captureSuffix(el) {
        const names = [this.options.icons.add, this.options.icons.remove]
            .filter(Boolean)
            .sort((a, b) => b.length - a.length)

        for (const cls of el.classList) {
            if (!cls.startsWith('icon-') || cls.startsWith('icon-size')) {
                continue
            }

            for (const n of names) {
                if (cls === `icon-${n}`) {
                    this._iconSuffix = ''
                    return
                }

                if (cls.startsWith(`icon-${n}-`)) {
                    this._iconSuffix = cls.slice(`icon-${n}`.length)
                    return
                }
            }
        }

        this._iconSuffix = ''
    }

    _iconEl() {
        for (const child of this.el.children) {
            if (child.classList?.contains('icon')) {
                return child
            }

            if (child.tagName === 'SVG' || child.querySelector?.('svg')) {
                return child.tagName === 'SVG' ? child : child
            }
        }

        return null
    }

    _setBusy(busy) {
        this._busy = !!busy
        if (this._busy) {
            this.el.setAttribute('aria-busy', 'true')
        } else {
            this.el.removeAttribute('aria-busy')
        }
    }
}
