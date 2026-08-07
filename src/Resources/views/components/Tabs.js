/**
 * Accessible tabs owner — discovers Tabs:Tab / Tabs:Panel children.
 * State SoT is ARIA (`aria-selected`) + panel `hidden`; look follows CSS.
 *
 * @extends {ShopwareComponent}
 */
export default class Tabs extends ShopwareComponent {
    static options = {
        tabComponent: 'ViewsTheme:Tabs:Tab',
        panelComponent: 'ViewsTheme:Tabs:Panel',
        changeEvent: 'ViewsTheme:Tabs:Change',
    }

    init() {
        this._onClick = this._onClick.bind(this)
        this._onKeydown = this._onKeydown.bind(this)

        this.el.addEventListener('click', this._onClick)
        this.el.addEventListener('keydown', this._onKeydown)

        const initial = this.options.active
        if (initial) {
            this.select(initial, { emit: false })
        }
    }

    destroy() {
        this.el.removeEventListener('click', this._onClick)
        this.el.removeEventListener('keydown', this._onKeydown)
    }

    /**
     * @param {string} tabId
     * @param {{ focus?: boolean, emit?: boolean }} options
     */
    select(tabId, { focus = false, emit = true } = {}) {
        const tab = this._tabs().find((el) => el.id === tabId)
        if (!tab) {
            return
        }

        this._activate(tab, { focus, emit })
    }

    _onClick(event) {
        const tab = event.target.closest(
            `[data-component="${this.options.tabComponent}"]`,
        )
        if (!tab || !this.el.contains(tab)) {
            return
        }

        event.preventDefault()
        this._activate(tab, { focus: false })
    }

    _onKeydown(event) {
        const tab = event.target.closest(
            `[data-component="${this.options.tabComponent}"]`,
        )
        if (!tab || !this.el.contains(tab)) {
            return
        }

        const tabs = this._tabs()
        const index = tabs.indexOf(tab)
        if (index < 0) {
            return
        }

        let next = -1

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                next = index === 0 ? tabs.length - 1 : index - 1
                break
            case 'ArrowRight':
            case 'ArrowDown':
                next = index === tabs.length - 1 ? 0 : index + 1
                break
            case 'Home':
                next = 0
                break
            case 'End':
                next = tabs.length - 1
                break
            default:
                return
        }

        event.preventDefault()
        this._activate(tabs[next], { focus: true })
    }

    /**
     * @param {HTMLElement} tab
     * @param {{ focus?: boolean, emit?: boolean }} options
     */
    _activate(tab, { focus = false, emit = true } = {}) {
        const tabs = this._tabs()
        const panels = this._panels()
        const panelId = tab.getAttribute('aria-controls')

        for (const item of tabs) {
            const selected = item === tab
            item.setAttribute('aria-selected', selected ? 'true' : 'false')
            item.tabIndex = selected ? 0 : -1
        }

        for (const panel of panels) {
            panel.hidden = panel.id !== panelId
        }

        if (focus) {
            tab.focus()
        }

        if (!emit) {
            return
        }

        window.Shopware.emit(this.options.changeEvent, {
            el: this.el,
            tabId: tab.id,
            panelId,
        })
    }

    /**
     * @returns {HTMLElement[]}
     */
    _tabs() {
        return Array.from(
            this.el.querySelectorAll(
                `[data-component="${this.options.tabComponent}"]`,
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
