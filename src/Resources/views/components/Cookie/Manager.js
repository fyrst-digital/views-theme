import { getInstanceByElement } from '@views-theme/modules/lazy-shell.js'
import { CLOSE_EVENT, snapshotState, submitConsent } from '@views-theme/modules/cookie/consent.js'

/**
 * Cookie manager form (body of the cookie drawer): saves the selected cookies, or accepts all,
 * then closes the drawer. The switches are `input[name="cookie"]`; a disabled switch is a
 * technically required cookie.
 *
 * @extends {ShopwareComponent}
 */
export default class CookieManager extends ShopwareComponent {
    static options = {
        groupsUrl: null,
        drawerComponentName: 'ViewsTheme:Drawer',
    }

    init() {
        this._busy = false
        this._onSubmit = this._onSubmit.bind(this)

        this.el.addEventListener('submit', this._onSubmit)

        // Taken before the shopper changes anything, to report only the cookies that changed.
        this._previous = snapshotState(this._cookies().map((input) => ({
            cookie: input.value,
            required: input.disabled,
        })))
    }

    destroy() {
        this.el.removeEventListener('submit', this._onSubmit)
    }

    /**
     * @returns {HTMLInputElement[]}
     */
    _cookies() {
        return [...this.el.querySelectorAll('input[name="cookie"]')]
    }

    /**
     * @param {SubmitEvent} event
     */
    async _onSubmit(event) {
        event.preventDefault()

        if (this._busy) {
            return
        }

        const acceptAll = event.submitter?.value === 'all'
        const selected = this._cookies()
            .filter((input) => input.checked && !input.disabled)
            .map((input) => input.value)

        this._busy = true
        this.el.setAttribute('aria-busy', 'true')

        try {
            const ok = await submitConsent(this.options.groupsUrl, acceptAll ? 'all' : 'selected', {
                selected,
                previous: this._previous,
            })

            if (ok) {
                document.$emitter?.publish(CLOSE_EVENT)
                this._closeDrawer()
            }
        } finally {
            this._busy = false
            this.el.removeAttribute('aria-busy')
        }
    }

    _closeDrawer() {
        const drawerEl = this.el.closest(`[data-component="${this.options.drawerComponentName}"]`)

        getInstanceByElement(this.options.drawerComponentName, drawerEl)?.close()
    }
}
