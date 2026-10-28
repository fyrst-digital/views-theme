import { wishlistCount } from '@views-theme/modules/wishlist/count.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Wishlist screen-reader live region — announces the count from its text template.
 *
 * @extends {ThemeComponent}
 */
export default class WishlistActionLive extends ThemeComponent {
    static options = {
        liveText: '%counter%',
    }

    init() {
        this.scope.effect(wishlistCount, (count) => {
            const template = this.options.liveText || '%counter%'
            this.el.textContent = template.replace('%counter%', String(count || 0))
        })
    }
}
