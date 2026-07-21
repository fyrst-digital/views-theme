const PRODUCT_SEARCH_PERFORMED_EVENT = 'product:search-performed'
const PRODUCT_SEARCH_SUGGESTION_SHOWN_EVENT = 'product:search-suggestion-shown'
const PRODUCT_SEARCH_SUGGESTION_PRODUCT_VIEWED_EVENT = 'product:search-suggestion-product-viewed'

export default class SearchBar extends ShopwareComponent {
    static options = {
        suggestUrl: null,
        minChars: 3,
        delay: 250,
        inputSelector: 'input[type="search"]',
        listboxId: 'search-suggest-listbox',
        viewAllSelector: '[data-action="view-all"]',
        overlayOpenEvent: 'ViewsTheme:Search:Overlay:open',
    }

    init() {
        this._input = this.el.querySelector(this.options.inputSelector)
        this._resultsEl = null
        this._suggestLinks = []
        this._debounceTimer = null
        this._abortController = null
        this._requestId = 0

        if (!this._input || !this.options.suggestUrl) {
            return
        }

        this._onInput = this._onInput.bind(this)
        this._onKeydown = this._onKeydown.bind(this)
        this._onSubmit = this._onSubmit.bind(this)
        this._onOverlayOpen = this._onOverlayOpen.bind(this)
        this._onResultsClick = this._onResultsClick.bind(this)
        this._onResultsKeydown = this._onResultsKeydown.bind(this)

        this._input.addEventListener('input', this._onInput)
        this._input.addEventListener('keydown', this._onKeydown)
        this.el.addEventListener('submit', this._onSubmit)
        document.addEventListener(this.options.overlayOpenEvent, this._onOverlayOpen)
    }

    destroy() {
        this._input?.removeEventListener('input', this._onInput)
        this._input?.removeEventListener('keydown', this._onKeydown)
        this.el.removeEventListener('submit', this._onSubmit)
        document.removeEventListener(this.options.overlayOpenEvent, this._onOverlayOpen)

        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer)
        }

        this._abortInFlight()
        this._clearResults()
    }

    _onInput() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer)
        }

        this._debounceTimer = setTimeout(() => {
            this._debounceTimer = null
            this._handleTermChange()
        }, this.options.delay)
    }

    _handleTermChange() {
        const term = this._input.value.trim()

        if (term.length < this.options.minChars) {
            this._abortInFlight()
            this._clearResults()
            return
        }

        void this._fetchSuggest(term)
    }

    async _fetchSuggest(term) {
        this._abortInFlight()
        this._abortController = new AbortController()
        const requestId = ++this._requestId

        this.el.setAttribute('aria-busy', 'true')

        try {
            const url = this._buildSuggestUrl(term)
            const response = await fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                signal: this._abortController.signal,
            })

            if (!response.ok) {
                throw new Error(`Suggest failed: ${response.status}`)
            }

            const html = await response.text()

            if (requestId !== this._requestId) {
                return
            }

            this._mountResults(html)
            this._input.setAttribute('aria-expanded', 'true')

            document.dispatchEvent(new CustomEvent(PRODUCT_SEARCH_SUGGESTION_SHOWN_EVENT, {
                detail: { term },
            }))
        } catch (error) {
            if (error?.name === 'AbortError') {
                return
            }

            if (requestId === this._requestId) {
                this._clearResults()
                console.error('SearchBar: suggest request failed', error)
            }
        } finally {
            if (requestId === this._requestId) {
                this.el.removeAttribute('aria-busy')
                this._abortController = null
            }
        }
    }

    _buildSuggestUrl(term) {
        const url = new URL(this.options.suggestUrl, window.location.origin)
        url.searchParams.set('search', term)
        return url.toString()
    }

    _mountResults(html) {
        this._teardownResultsListeners()

        const template = document.createElement('template')
        template.innerHTML = html.trim()
        const next = template.content.firstElementChild

        if (!next) {
            this._clearResults()
            return
        }

        if (this._resultsEl) {
            this._resultsEl.replaceWith(next)
        } else {
            this.el.insertAdjacentElement('afterend', next)
        }

        this._resultsEl = next
        this._bindResults()
    }

    _bindResults() {
        if (!this._resultsEl) {
            return
        }

        const listbox = this._resultsEl.id
            ? this._resultsEl
            : this._resultsEl.querySelector(`#${this.options.listboxId}`)

        if (listbox?.id) {
            this._input.setAttribute('aria-controls', listbox.id)
        }

        this._suggestLinks = this._getFocusableLinks(this._resultsEl)
        this._resultsEl.addEventListener('click', this._onResultsClick)
        this._resultsEl.addEventListener('keydown', this._onResultsKeydown)
    }

    _teardownResultsListeners() {
        if (!this._resultsEl) {
            return
        }

        this._resultsEl.removeEventListener('click', this._onResultsClick)
        this._resultsEl.removeEventListener('keydown', this._onResultsKeydown)
        this._suggestLinks = []
    }

    _clearResults() {
        this._teardownResultsListeners()

        if (this._resultsEl) {
            this._resultsEl.remove()
            this._resultsEl = null
        }

        this._input?.removeAttribute('aria-controls')
        this._input?.setAttribute('aria-expanded', 'false')
    }

    _abortInFlight() {
        if (this._abortController) {
            this._abortController.abort()
            this._abortController = null
        }
    }

    _onSubmit(event) {
        const term = this._input.value.trim()

        if (term.length < this.options.minChars) {
            event.preventDefault()
            event.stopPropagation()
            return
        }

        document.dispatchEvent(new CustomEvent(PRODUCT_SEARCH_PERFORMED_EVENT, {
            detail: { term },
        }))
    }

    _onOverlayOpen(event) {
        const overlay = event.target
        if (!(overlay instanceof Element) || !overlay.contains(this.el)) {
            return
        }

        if (this._resultsEl && !this._resultsEl.isConnected) {
            this._resultsEl = null
        }

        const term = this._input.value.trim()
        if (term.length < this.options.minChars) {
            return
        }

        if (this._resultsEl) {
            return
        }

        void this._fetchSuggest(term)
    }

    _onResultsClick(event) {
        const link = event.target.closest?.('a[href]')
        if (!link || !this._resultsEl?.contains(link)) {
            return
        }

        const term = this._input.value.trim()
        const isViewAll = Boolean(link.closest(this.options.viewAllSelector))
        const eventName = isViewAll
            ? PRODUCT_SEARCH_PERFORMED_EVENT
            : PRODUCT_SEARCH_SUGGESTION_PRODUCT_VIEWED_EVENT

        document.dispatchEvent(new CustomEvent(eventName, {
            detail: { term },
        }))
    }

    _onKeydown(event) {
        if (event.key !== 'ArrowDown' || this._input.value.trim() === '') {
            return
        }

        if (!this._suggestLinks.length) {
            return
        }

        event.preventDefault()
        this._focusElement(this._suggestLinks[0])
    }

    _onResultsKeydown(event) {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return
        }

        const currentIndex = this._suggestLinks.indexOf(event.target)
        if (currentIndex === -1) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        if (event.key === 'ArrowDown') {
            const next = this._suggestLinks[currentIndex + 1]
            if (next) {
                this._focusElement(next)
            }
            return
        }

        if (currentIndex === 0) {
            this._focusElement(this._input)
            return
        }

        this._focusElement(this._suggestLinks[currentIndex - 1])
    }

    _getFocusableLinks(root) {
        if (window.focusHandler && typeof window.focusHandler.getFocusableElements === 'function') {
            return Array.from(window.focusHandler.getFocusableElements(root))
        }

        return Array.from(root.querySelectorAll('a[href], button:not([disabled])'))
    }

    _focusElement(element) {
        if (!element) {
            return
        }

        if (window.focusHandler && typeof window.focusHandler.setFocus === 'function') {
            window.focusHandler.setFocus(element, { focusVisible: true })
            return
        }

        element.focus()
    }
}
