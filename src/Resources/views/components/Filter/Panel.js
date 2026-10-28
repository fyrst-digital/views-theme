import { busy, liveText } from '@views-theme/modules/listing/store.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Filter panel: mirrors the listing busy state (`aria-busy`) and writes the
 * results announcement into its own live region.
 *
 * @extends {ThemeComponent}
 */
export default class FilterPanel extends ThemeComponent {
    init() {
        this.scope.effect(busy, (value) => {
            this.el.setAttribute('aria-busy', value ? 'true' : 'false')
        })
        this.scope.effect(liveText, ({ text }) => {
            const live = this.el.querySelector('[data-aria-live]')
            if (live && text) {
                live.textContent = text
            }
        })
    }
}
