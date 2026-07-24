export default class NavigationDrawerMenu extends ShopwareComponent {
    static options = {
        drillEvent: 'ViewsTheme:Navigation:Drawer:Menu:Drill',
        showActiveSelector: '[data-component="ViewsTheme:Navigation:Drawer:ShowActive"]',
        drillSelector: '[data-component="ViewsTheme:Navigation:Drawer:Drill"]',
        loadingAttr: 'aria-busy',
    }

    init() {
        this._cache = {}
        this._loading = false
        this._onDrill = this._onDrill.bind(this)
        window.Shopware.on(this.options.drillEvent, this._onDrill)
    }

    destroy() {
        window.Shopware.off(this.options.drillEvent, this._onDrill)
    }

    _onDrill(payload = {}) {
        const { url, source } = payload

        if (!url || !source || !this.el.contains(source)) {
            return
        }

        if (this._loading || source.getAttribute(this.options.loadingAttr) === 'true') {
            return
        }

        this._loadLevel(url, source)
    }

    async _loadLevel(url, source) {
        this._loading = true
        source.setAttribute(this.options.loadingAttr, 'true')

        try {
            let html = this._cache[url]

            if (!html) {
                const response = await fetch(url, {
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                })

                if (!response.ok) {
                    throw new Error(`Navigation menu fetch failed: ${response.status}`)
                }

                html = await response.text()
                this._cache[url] = html
            }

            this._replaceLevel(html)
        } catch (error) {
            console.error('NavigationDrawerMenu: Failed to load menu level', error)
        } finally {
            this._loading = false
            source.removeAttribute(this.options.loadingAttr)
        }
    }

    _parseRoot(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstElementChild
    }

    _replaceLevel(html) {
        const next = this._parseRoot(html)
        if (!next) {
            return
        }

        this.el.replaceChildren(...next.children)

        const focusTarget =
            this.el.querySelector(`${this.options.showActiveSelector} a`) ||
            this.el.querySelector(this.options.drillSelector) ||
            this.el.querySelector('a, button')

        if (focusTarget) {
            requestAnimationFrame(() => {
                window.focusHandler.setFocus(focusTarget, { focusVisible: true })
            })
        }
    }
}
