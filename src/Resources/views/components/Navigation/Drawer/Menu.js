export default class NavigationDrawerMenu extends ShopwareComponent {
    static options = {
        drillSelector: '[data-action="drill"]',
        loadingAttr: 'aria-busy',
    }

    init() {
        this._cache = {}
        this._loading = false
        this._onClick = this._onClick.bind(this)
        this.el.addEventListener('click', this._onClick)
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
    }

    _onClick(event) {
        const link = event.target.closest(this.options.drillSelector)
        if (!link || !this.el.contains(link)) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        if (this._loading || link.getAttribute(this.options.loadingAttr) === 'true') {
            return
        }

        const url = link.getAttribute('data-href') || link.getAttribute('href')
        if (!url) {
            return
        }

        this._loadLevel(url, link)
    }

    async _loadLevel(url, link) {
        this._loading = true
        link.setAttribute(this.options.loadingAttr, 'true')

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
            link.removeAttribute(this.options.loadingAttr)
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

        // Keep this component root + instance; swap level contents only
        this.el.replaceChildren(...next.children)

        const focusTarget =
            this.el.querySelector('[data-action="current"]') ||
            this.el.querySelector(this.options.drillSelector) ||
            this.el.querySelector('a, button')

        if (focusTarget) {
            requestAnimationFrame(() => {
                window.focusHandler.setFocus(focusTarget, { focusVisible: true })
            })
        }
    }
}
