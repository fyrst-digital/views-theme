export default class NavigationDrawerMenu extends ShopwareComponent {
    static options = {
        drillEvent: 'ViewsTheme:Navigation:Drawer:Menu:Drill',
    }

    init() {
        this._cache = {}
        this._busy = false
        this._onDrill = this._onDrill.bind(this)
        window.Shopware.on(this.options.drillEvent, this._onDrill)
    }

    destroy() {
        window.Shopware.off(this.options.drillEvent, this._onDrill)
    }

    _onDrill(payload = {}) {
        const { url, source, direction = 'forward' } = payload

        if (!url || !source || !this.el.contains(source) || this._busy) {
            return
        }

        if (source.getAttribute('aria-busy') === 'true') {
            return
        }

        this._go(url, source, direction === 'back' ? 'back' : 'forward')
    }

    async _go(url, source, direction) {
        this._busy = true
        source.setAttribute('aria-busy', 'true')

        try {
            const html = await this._fetch(url)
            const incoming = this._levelFromHtml(html)
            if (!incoming) {
                return
            }

            const outgoing = this._level()

            if (!outgoing || this._prefersReducedMotion()) {
                if (outgoing) {
                    outgoing.replaceWith(incoming)
                } else {
                    this.el.replaceChildren(incoming)
                }
            } else {
                await this._slide(outgoing, incoming, direction)
            }
        } catch (error) {
            console.error('NavigationDrawerMenu: Failed to load menu level', error)
        } finally {
            this._busy = false
            source.removeAttribute('aria-busy')
        }
    }

    async _fetch(url) {
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

        return html
    }

    _level(root = this.el) {
        return root.querySelector(':scope > [data-level]')
    }

    _levelFromHtml(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        const root = template.content.firstElementChild
        return root ? this._level(root) : null
    }

    async _slide(outgoing, incoming, direction) {
        const fromH = outgoing.getBoundingClientRect().height
        this.el.style.height = `${fromH}px`
        this.el.setAttribute('data-animating', 'true')
        this.el.setAttribute('data-direction', direction)

        outgoing.inert = true
        incoming.setAttribute('data-state', 'enter')
        incoming.inert = true
        this.el.append(incoming)

        const toH = incoming.getBoundingClientRect().height
        void this.el.offsetWidth

        const heightAnim = this.el.animate(
            [{ height: `${fromH}px` }, { height: `${toH}px` }],
            {
                duration: this._duration(),
                easing: 'ease',
                fill: 'forwards',
            },
        )

        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                outgoing.setAttribute('data-state', 'out')
                incoming.setAttribute('data-state', 'in')
                resolve()
            })
        })

        await Promise.all([this._waitTransform(incoming), heightAnim.finished])

        heightAnim.cancel()
        outgoing.remove()
        incoming.removeAttribute('data-state')
        incoming.inert = false
        this.el.removeAttribute('data-animating')
        this.el.removeAttribute('data-direction')
        this.el.style.height = ''
    }

    _waitTransform(el) {
        return new Promise((resolve) => {
            const done = (event) => {
                if (event && (event.target !== el || event.propertyName !== 'transform')) {
                    return
                }

                el.removeEventListener('transitionend', done)
                window.clearTimeout(timer)
                resolve()
            }

            el.addEventListener('transitionend', done)
            const timer = window.setTimeout(() => done(), this._duration() + 50)
        })
    }

    _duration() {
        const raw = getComputedStyle(this.el)
            .getPropertyValue('--vi-navigation-drawer-menu-duration')
        const ms = parseFloat(raw)

        return Number.isFinite(ms) ? ms : 250
    }

    _prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
}
