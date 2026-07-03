import Plugin from 'src/plugin-system/plugin.class';

export default class VariantsGridPlugin extends Plugin {
    static options = {
        quantityInputSelector: '[data-component="quantity-input"] input[type="number"]',
        buyButtonSelector: '[data-component="buy-button"]',
        gridBodySelector: '[data-component="grid-body"]',
        paginationSelector: '[data-component="pagination"]',
        memorySelector: '[data-component="grid-memory"]',
        errorSelector: '[data-component="error-message"]',
        liveRegionSelector: '[data-component="live-region"]',
    };

    init() {
        this._buyButton = this.el.querySelector(this.options.buyButtonSelector);
        this._gridBody = this.el.querySelector(this.options.gridBodySelector);
        this._pagination = this.el.querySelector(this.options.paginationSelector);
        this._memory = this.el.querySelector(this.options.memorySelector);
        this._error = this.el.querySelector(this.options.errorSelector);
        this._liveRegion = this.el.querySelector(this.options.liveRegionSelector);
        this._loadUrl = this.el.getAttribute('data-load-url');
        this._parentId = this.el.getAttribute('data-parent-id');
        this._quantityMap = new Map();

        this._registerEvents();
        this._syncVisibleInputsToMap();
        this._updateButtonState();
    }

    _registerEvents() {
        this.el.addEventListener('input', this._onInputChange.bind(this));
        this.el.addEventListener('change', this._onInputChange.bind(this));

        if (this._pagination) {
            this._pagination.addEventListener('click', this._onPaginationClick.bind(this));
        }

        const form = this.el.tagName === 'FORM' ? this.el : this.el.querySelector('form');
        if (form) {
            form.addEventListener('submit', this._onSubmit.bind(this), true);
        }

        window.addEventListener('popstate', this._onPopState.bind(this));
    }

    _onInputChange(event) {
        const input = event.target.closest(this.options.quantityInputSelector);
        if (!input || !this.el.contains(input)) {
            return;
        }

        const variantId = this._getVariantIdFromInput(input);
        if (variantId) {
            this._quantityMap.set(variantId, parseInt(input.value, 10) || 0);
        }

        this._updateButtonState();
    }

    _onPaginationClick(event) {
        const link = event.target.closest('a[href*="variantsPage="]');
        if (!link || !this._pagination || !this._pagination.contains(link)) {
            return;
        }

        const page = this._getPageFromUrl(link.href);
        if (page === null || page === this._getCurrentPage() || link.getAttribute('aria-disabled') === 'true') {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        this._loadPage(page);
    }

    _getCurrentPage() {
        return this._getPageFromUrl(window.location.href) || 1;
    }

    _getPageFromUrl(urlString) {
        const url = new URL(urlString, window.location.origin);
        const page = url.searchParams.get('variantsPage');

        return page ? parseInt(page, 10) : null;
    }

    async _loadPage(page) {
        if (!this._loadUrl || !this._gridBody || page < 1) {
            return;
        }

        this._hideError();
        this.el.classList.add('is-loading');

        try {
            const url = new URL(this._loadUrl, window.location.origin);
            url.searchParams.set('parentId', this._parentId);
            url.searchParams.set('variantsPage', String(page));

            const response = await fetch(url.toString(), {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status}`);
            }

            const data = await response.json();

            this._gridBody.innerHTML = data.rows || '';

            if (this._pagination && data.pagination !== undefined) {
                this._pagination.innerHTML = data.pagination;
            }

            this._applyQuantitiesFromMap();
            this._reinitializePlugins();
            this._updateUrl(page);
            this._setFocusToGridBody();
            this._announcePageLoaded(page);
        } catch (error) {
            this._showError();
            console.error('VariantsGrid: Failed to load page', error);
        } finally {
            this.el.classList.remove('is-loading');
        }
    }

    _applyQuantitiesFromMap() {
        this.el.querySelectorAll(this.options.quantityInputSelector).forEach((input) => {
            const variantId = this._getVariantIdFromInput(input);
            if (variantId && this._quantityMap.has(variantId)) {
                input.value = String(this._quantityMap.get(variantId));
            }
        });
    }

    _syncVisibleInputsToMap() {
        this.el.querySelectorAll(this.options.quantityInputSelector).forEach((input) => {
            const variantId = this._getVariantIdFromInput(input);
            if (variantId) {
                this._quantityMap.set(variantId, parseInt(input.value, 10) || 0);
            }
        });
    }

    _getVariantIdFromInput(input) {
        const name = input.getAttribute('name') || '';
        const match = name.match(/lineItems\[([^\]]+)\]/);

        return match ? match[1] : null;
    }

    _updateButtonState() {
        if (!this._buyButton) {
            return;
        }

        let hasSelection = false;

        this._quantityMap.forEach((quantity) => {
            if (quantity > 0) {
                hasSelection = true;
            }
        });

        this._buyButton.disabled = !hasSelection;
    }

    _onSubmit() {
        this._syncVisibleInputsToMap();

        if (this._memory) {
            this._memory.innerHTML = '';
        }

        const visibleIds = new Set();
        this.el.querySelectorAll(this.options.quantityInputSelector).forEach((input) => {
            const variantId = this._getVariantIdFromInput(input);
            if (variantId) {
                visibleIds.add(variantId);
            }
        });

        this._quantityMap.forEach((quantity, variantId) => {
            if (quantity > 0 && !visibleIds.has(variantId) && this._memory) {
                this._memory.insertAdjacentHTML('beforeend', this._buildHiddenInputs(variantId, quantity));
            }
        });
    }

    _buildHiddenInputs(variantId, quantity) {
        const id = this._escapeHtml(variantId);
        const qty = this._escapeHtml(String(quantity));

        return `
            <input type="hidden" name="lineItems[${id}][id]" value="${id}">
            <input type="hidden" name="lineItems[${id}][type]" value="product">
            <input type="hidden" name="lineItems[${id}][referencedId]" value="${id}">
            <input type="hidden" name="lineItems[${id}][quantity]" value="${qty}">
            <input type="hidden" name="lineItems[${id}][stackable]" value="1">
            <input type="hidden" name="lineItems[${id}][removable]" value="1">
        `;
    }

    _updateUrl(page) {
        const url = new URL(window.location.href);
        url.searchParams.set('variantsPage', String(page));
        window.history.pushState({ variantsPage: page }, '', url.toString());
    }

    _onPopState() {
        const url = new URL(window.location.href);
        const page = url.searchParams.get('variantsPage');

        if (page) {
            this._loadPage(parseInt(page, 10));
        }
    }

    _reinitializePlugins() {
        if (window.PluginManager && typeof window.PluginManager.initializePluginsInParentElement === 'function') {
            window.PluginManager.initializePluginsInParentElement(this._gridBody);
        }
    }

    _setFocusToGridBody() {
        if (!this._gridBody) {
            return;
        }

        this._gridBody.setAttribute('tabindex', '-1');
        this._gridBody.focus({ preventScroll: true });
    }

    _announcePageLoaded(page) {
        if (!this._liveRegion) {
            return;
        }

        const template = this._liveRegion.getAttribute('data-page-loaded-template') || 'Page %page% loaded';
        this._liveRegion.textContent = template.replace('%page%', String(page));
    }

    _showError() {
        if (this._error) {
            this._error.classList.remove('d-none');
        }
    }

    _hideError() {
        if (this._error) {
            this._error.classList.add('d-none');
        }
    }

    _escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value;

        return div.innerHTML;
    }
}
