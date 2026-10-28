import ThemeComponent from '@views-theme/modules/theme-component.js'

import { connectControl } from '@views-theme/modules/listing/store.js'
import { connectReviewControl } from '@views-theme/modules/review/store.js'

const LISTING_OWNER = 'ViewsTheme:Product:Listing'
const REVIEW_OWNER = 'ViewsTheme:Review:Panel'

/**
 * @extends {ThemeComponent}
 */
export default class Pagination extends ThemeComponent {
    static options = {
        page: null,
        pageParameter: 'p',
        ownerComponent: LISTING_OWNER,
    }

    init() {
        this._page = this._resolveInitialPage()
        // The owner decides which registry takes this control (Orders paginate with plain links).
        if (this.options.ownerComponent === LISTING_OWNER) {
            this.scope.add(connectControl(this))
        } else if (this.options.ownerComponent === REVIEW_OWNER) {
            this.scope.add(connectReviewControl(this))
        }
    }

    getValues() {
        const key = this.options.pageParameter || 'p'

        return { [key]: this._page }
    }

    getParamKeys() {
        return [this.options.pageParameter || 'p']
    }

    getLabels() {
        return []
    }

    reset() {}

    resetAll() {}

    setFromUrl(params) {
        const key = this.options.pageParameter || 'p'
        const raw = params?.[key]
        const page = raw === undefined || raw === null || raw === ''
            ? 1
            : Number(raw)

        this._page = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    }

    _resolveInitialPage() {
        if (this.options.page !== null && this.options.page !== undefined && this.options.page !== '') {
            const fromOptions = Number(this.options.page)
            if (Number.isFinite(fromOptions) && fromOptions > 0) {
                return Math.floor(fromOptions)
            }
        }

        const active = this.el.querySelector('[aria-current="page"]')
        if (active) {
            try {
                const options = JSON.parse(active.getAttribute('data-component-options') || '{}')
                const page = Number(options.page)
                if (Number.isFinite(page) && page > 0) {
                    return Math.floor(page)
                }
            } catch {
                // fall through
            }
        }

        return 1
    }
}
