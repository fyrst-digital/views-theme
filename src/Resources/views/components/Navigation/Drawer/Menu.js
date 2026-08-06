/**
 * @extends {ShopwareComponent}
 */
export default class NavigationDrawerMenu extends ShopwareComponent {
    static options = {
        drillEvent: 'ViewsTheme:Navigation:Drawer:Menu:Drill',
        scrollSelector: '[data-component="ViewsTheme:Scroll:Area"]',
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

            const port = this._scrollEl()
            const outgoing = this._level(port)

            if (!outgoing || this._prefersReducedMotion()) {
                if (outgoing) {
                    outgoing.replaceWith(incoming)
                } else if (port) {
                    port.replaceChildren(incoming)
                } else {
                    this.el.replaceChildren(incoming)
                }
            } else {
                await this._slide(outgoing, incoming, direction, port)
            }

            this._resetScroll(port)
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

    _scrollEl(root = this.el) {
        return root.querySelector(`:scope > ${this.options.scrollSelector}`)
    }

    _level(root = this._scrollEl()) {
        if (!root) {
            return null
        }

        return root.querySelector(':scope > [data-level]')
    }

    _levelFromHtml(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        const root = template.content.firstElementChild
        if (!root) {
            return null
        }

        return this._level(this._scrollEl(root) || root)
    }

    async _slide(outgoing, incoming, direction, port = this._scrollEl()) {
        const host = port || this.el

        // Phase 1: start poses (absolute + inset:0 via CSS), no transition yet.
        this.el.setAttribute('data-direction', direction)
        outgoing.inert = true
        outgoing.setAttribute('data-state', 'from')
        incoming.inert = true
        incoming.setAttribute('data-state', 'enter')
        host.append(incoming)

        void host.offsetWidth
        await this._nextFrame()

        // Phase 2: enable transition, flip to end poses.
        this.el.setAttribute('data-animating', 'true')
        void host.offsetWidth
        await this._nextFrame()

        outgoing.setAttribute('data-state', 'out')
        incoming.setAttribute('data-state', 'in')

        await this._waitTransform(incoming)

        outgoing.remove()
        incoming.removeAttribute('data-state')
        incoming.inert = false
        this.el.removeAttribute('data-animating')
        this.el.removeAttribute('data-direction')
    }

    _nextFrame() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => resolve())
        })
    }

    _resetScroll(port = this._scrollEl()) {
        if (!port) {
            return
        }

        port.scrollTop = 0
        port.dispatchEvent(new Event('scroll'))
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
            .getPropertyValue('--vi-menu-duration')
            .trim()
        if (!raw) {
            return 250
        }

        if (raw.endsWith('ms')) {
            return Number.parseFloat(raw) || 250
        }

        if (raw.endsWith('s')) {
            return (Number.parseFloat(raw) || 0) * 1000 || 250
        }

        return Number.parseFloat(raw) || 250
    }

    _prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
}
