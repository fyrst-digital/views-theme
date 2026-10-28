import { saveReview } from '@views-theme/modules/review/store.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Review form region — write/edit submit via Panel.save after Form:Handler validates.
 * Guest Account:Login submits natively (not intercepted).
 *
 * @extends {ThemeComponent}
 */
export default class ReviewForm extends ThemeComponent {
    static options = {
        submitEvent: 'ViewsTheme:Form:Handler:Submit',
    }

    init() {
        this._onSubmit = this._onSubmit.bind(this)
        this.scope.bus(this.options.submitEvent, this._onSubmit)
    }

    /**
     * @param {{ el?: Element, form?: HTMLFormElement, handler?: { setSubmitting: (busy: boolean) => void, el?: Element } }} payload
     */
    _onSubmit(payload) {
        const form = payload?.form || payload?.el
        if (!(form instanceof HTMLFormElement) || !this.el.contains(form)) {
            return
        }

        const handler = payload?.handler
        const saving = saveReview(new FormData(form))
        if (!saving) {
            handler?.setSubmitting(false)
            return
        }

        saving
            .catch(() => {})
            .finally(() => {
                if (handler?.el && document.contains(handler.el)) {
                    handler.setSubmitting(false)
                }
            })
    }
}
