/**
 * Accessible accordion owner — discovers Accordion:Header / Accordion:Panel children.
 * State SoT is ARIA (`aria-expanded`) + panel `hidden`; look follows CSS.
 *
 * @extends {ShopwareComponent}
 */
export default class Accordion extends ShopwareComponent {
    static options = {
        headerComponent: 'ViewsTheme:Accordion:Header',
        panelComponent: 'ViewsTheme:Accordion:Panel',
        changeEvent: 'ViewsTheme:Accordion:Change',
        active: null,
        multiple: false,
        collapsible: true,
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this._onKeydown = this._onKeydown.bind(this)

        this.el.addEventListener('click', this._onClick)
        this.el.addEventListener('keydown', this._onKeydown)

        const initial = this.options.active
        if (initial) {
            this.open(initial, { emit: false })
        }
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        this.el.removeEventListener('keydown', this._onKeydown)
    }

    /**
     * @param {string} headerId
     * @param {{ focus?: boolean, emit?: boolean }} options
     */
    toggle(headerId, options = {}) {
        const header = this._headerById(headerId)
        if (!header) {
            return
        }

        if (header.getAttribute('aria-expanded') === 'true') {
            this.close(headerId, options)
            return
        }

        this.open(headerId, options)
    }

    /**
     * @param {string} headerId
     * @param {{ focus?: boolean, emit?: boolean }} options
     */
    open(headerId, { focus = false, emit = true } = {}) {
        const header = this._headerById(headerId)
        if (!header) {
            return
        }

        if (!this._isMultiple()) {
            for (const item of this._headers()) {
                if (item !== header) {
                    this._setExpanded(item, false)
                }
            }
        }

        this._setExpanded(header, true)

        if (focus) {
            header.focus()
        }

        if (emit) {
            this._emit(header, true)
        }
    }

    /**
     * @param {string} headerId
     * @param {{ focus?: boolean, emit?: boolean }} options
     */
    close(headerId, { focus = false, emit = true } = {}) {
        const header = this._headerById(headerId)
        if (!header) {
            return
        }

        if (!this._isCollapsible() && this._expandedHeaders().length <= 1) {
            return
        }

        this._setExpanded(header, false)

        if (focus) {
            header.focus()
        }

        if (emit) {
            this._emit(header, false)
        }
    }

    _onClick(event) {
        const header = event.target.closest(
            `[data-component="${this.options.headerComponent}"]`,
        )
        if (!header || !this.el.contains(header)) {
            return
        }

        event.preventDefault()
        this.toggle(header.id)
    }

    _onKeydown(event) {
        const header = event.target.closest(
            `[data-component="${this.options.headerComponent}"]`,
        )
        if (!header || !this.el.contains(header) || event.target !== header) {
            return
        }

        const headers = this._headers()
        const index = headers.indexOf(header)
        if (index < 0) {
            return
        }

        let next = -1

        switch (event.key) {
            case 'ArrowUp':
                next = index === 0 ? headers.length - 1 : index - 1
                break
            case 'ArrowDown':
                next = index === headers.length - 1 ? 0 : index + 1
                break
            case 'Home':
                next = 0
                break
            case 'End':
                next = headers.length - 1
                break
            default:
                return
        }

        event.preventDefault()
        headers[next].focus()
    }

    /**
     * @param {HTMLElement} header
     * @param {boolean} expanded
     */
    _setExpanded(header, expanded) {
        header.setAttribute('aria-expanded', expanded ? 'true' : 'false')

        const panelId = header.getAttribute('aria-controls')
        const panel = this._panels().find((el) => el.id === panelId)
        if (panel) {
            panel.hidden = !expanded
        }
    }

    /**
     * @param {HTMLElement} header
     * @param {boolean} expanded
     */
    _emit(header, expanded) {
        window.Shopware.emit(this.options.changeEvent, {
            el: this.el,
            itemId: header.id,
            panelId: header.getAttribute('aria-controls'),
            expanded,
        })
    }

    /**
     * @returns {boolean}
     */
    _isMultiple() {
        return this.options.multiple === true || this.options.multiple === 'true'
    }

    /**
     * @returns {boolean}
     */
    _isCollapsible() {
        return this.options.collapsible !== false && this.options.collapsible !== 'false'
    }

    /**
     * @param {string} headerId
     * @returns {HTMLElement|undefined}
     */
    _headerById(headerId) {
        return this._headers().find((el) => el.id === headerId)
    }

    /**
     * @returns {HTMLElement[]}
     */
    _expandedHeaders() {
        return this._headers().filter(
            (el) => el.getAttribute('aria-expanded') === 'true',
        )
    }

    /**
     * @returns {HTMLElement[]}
     */
    _headers() {
        return Array.from(
            this.el.querySelectorAll(
                `[data-component="${this.options.headerComponent}"]`,
            ),
        )
    }

    /**
     * @returns {HTMLElement[]}
     */
    _panels() {
        return Array.from(
            this.el.querySelectorAll(
                `[data-component="${this.options.panelComponent}"]`,
            ),
        )
    }
}
