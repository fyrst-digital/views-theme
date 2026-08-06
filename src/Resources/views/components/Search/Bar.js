const ANALYTICS = {
    performed: 'product:search-performed',
    suggestionShown: 'product:search-suggestion-shown',
    productViewed: 'product:search-suggestion-product-viewed',
}

/**
 * @extends {ShopwareComponent}
 */
export default class SearchBar extends ShopwareComponent {
    static options = {
        suggestUrl: null,
        minChars: 3,
        delay: 250,
        inputSelector: 'input[type="search"]',
        viewAllSelector: '[data-action="view-all"]',
    }

    init() {
        this._input = this.el.querySelector(this.options.inputSelector)
        this._resultsEl = null
        this._suggestLinks = []
        this._debounceTimer = null
        this._abortController = null
        this._resultsAbort = null

        if (!this._input || !this.options.suggestUrl) {
            return
        }

        this._onInput = this._onInput.bind(this)
        this._onKeydown = this._onKeydown.bind(this)
        this._onSubmit = this._onSubmit.bind(this)
        this._onResultsClick = this._onResultsClick.bind(this)
        this._onResultsKeydown = this._onResultsKeydown.bind(this)

        this._input.addEventListener('input', this._onInput)
        this._input.addEventListener('keydown', this._onKeydown)
        this.el.addEventListener('submit', this._onSubmit)
    }

    getTerm() {
        return this._input?.value?.trim() ?? ''
    }

    setTerm(term) {
        if (!this._input) {
            return
        }

        this._input.value = typeof term === 'string' ? term : ''
    }

    focusInput() {
        if (!this._input) {
            return
        }

        requestAnimationFrame(() => {
            this._input?.focus()
        })
    }

    destroy() {
        this._input?.removeEventListener('input', this._onInput)
        this._input?.removeEventListener('keydown', this._onKeydown)
        this.el.removeEventListener('submit', this._onSubmit)

        clearTimeout(this._debounceTimer)
        this._abortInFlight()
        this._clearResults()
    }

    _emit(name, term = this.getTerm()) {
        document.dispatchEvent(new CustomEvent(name, { detail: { term } }))
    }

    _onInput() {
        clearTimeout(this._debounceTimer)
        this._debounceTimer = setTimeout(() => {
            this._debounceTimer = null
            this._syncSuggestFromInput()
        }, this.options.delay)
    }

    _syncSuggestFromInput() {
        const term = this.getTerm()

        if (term.length < this.options.minChars) {
            this._abortInFlight()
            this._clearResults()
            return
        }

        void this._fetchSuggest(term)
    }

    async _fetchSuggest(term) {
        this._abortInFlight()
        const ac = new AbortController()
        this._abortController = ac

        this.el.setAttribute('aria-busy', 'true')

        try {
            const url = new URL(this.options.suggestUrl, window.location.origin)
            url.searchParams.set('search', term)

            const response = await fetch(url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                signal: ac.signal,
            })

            if (!response.ok) {
                throw new Error(`Suggest failed: ${response.status}`)
            }

            const html = await response.text()
            if (ac.signal.aborted) {
                return
            }

            this._mountResults(html)
            this._input.setAttribute('aria-expanded', 'true')
            this._emit(ANALYTICS.suggestionShown, term)
        } catch (error) {
            if (error?.name === 'AbortError' || ac.signal.aborted) {
                return
            }

            this._clearResults()
            console.error('SearchBar: suggest request failed', error)
        } finally {
            if (this._abortController === ac) {
                this.el.removeAttribute('aria-busy')
                this._abortController = null
            }
        }
    }

    _mountResults(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        const next = template.content.firstElementChild

        if (!next) {
            this._clearResults()
            return
        }

        this._unbindResults()

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

        if (this._resultsEl.id) {
            this._input.setAttribute('aria-controls', this._resultsEl.id)
        }

        this._suggestLinks = Array.from(
            window.focusHandler.getFocusableElements(this._resultsEl),
        )

        this._resultsAbort = new AbortController()
        const { signal } = this._resultsAbort

        this._resultsEl.addEventListener('click', this._onResultsClick, { signal })
        this._resultsEl.addEventListener('keydown', this._onResultsKeydown, { signal })
    }

    _unbindResults() {
        this._resultsAbort?.abort()
        this._resultsAbort = null
        this._suggestLinks = []
    }

    _clearResults() {
        this._unbindResults()

        if (this._resultsEl) {
            this._resultsEl.remove()
            this._resultsEl = null
        }

        this._input?.removeAttribute('aria-controls')
        this._input?.setAttribute('aria-expanded', 'false')
    }

    _abortInFlight() {
        this._abortController?.abort()
        this._abortController = null
    }

    _onSubmit(event) {
        const term = this.getTerm()

        if (term.length < this.options.minChars) {
            event.preventDefault()
            event.stopPropagation()
            return
        }

        this._emit(ANALYTICS.performed, term)
    }

    /**
     * Apply an optional restored term and run suggest when eligible.
     * Called by Overlay.open only (Open bus event is for Action aria, not suggest).
     */
    onOpened(term = null) {
        if (typeof term === 'string') {
            this.setTerm(term)
        }

        if (this._resultsEl && !this._resultsEl.isConnected) {
            this._resultsEl = null
        }

        this._syncSuggest()
    }

    _syncSuggest() {
        const term = this.getTerm()
        if (term.length < this.options.minChars) {
            this._abortInFlight()
            this._clearResults()
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

        const isViewAll = Boolean(link.closest(this.options.viewAllSelector))
        this._emit(isViewAll ? ANALYTICS.performed : ANALYTICS.productViewed)
    }

    _onKeydown(event) {
        if (event.key !== 'ArrowDown' || !this.getTerm() || !this._suggestLinks.length) {
            return
        }

        event.preventDefault()
        window.focusHandler.setFocus(this._suggestLinks[0], { focusVisible: true })
    }

    _onResultsKeydown(event) {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
            return
        }

        const index = this._suggestLinks.indexOf(event.target)
        if (index === -1) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        const next = event.key === 'ArrowDown'
            ? this._suggestLinks[index + 1]
            : index === 0
                ? this._input
                : this._suggestLinks[index - 1]

        if (next) {
            window.focusHandler.setFocus(next, { focusVisible: true })
        }
    }
}
