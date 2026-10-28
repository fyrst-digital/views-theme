import { wishlistCount } from '@views-theme/modules/wishlist/count.js'
import { effect } from '@views-theme/modules/shared/signal.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Header wishlist badge — follows the wishlist count signal.
 *
 * @extends {ThemeComponent}
 */
export default class WishlistActionBadge extends ThemeComponent {
    init() {
        this.scope.effect(wishlistCount, (count) => this._render(count))
    }

    _render(count) {
        if (count > 0) {
            this.el.hidden = false
            this.el.textContent = String(count)
        } else {
            this.el.hidden = true
            this.el.textContent = ''
        }
    }
}
