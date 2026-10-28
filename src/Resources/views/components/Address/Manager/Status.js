import { bindStatus } from '@views-theme/modules/address/filter.js'
import ThemeComponent from '@views-theme/modules/theme-component.js'

/**
 * Empty / not-found status for the address list; follows the shared address filter.
 *
 * @extends {ThemeComponent}
 */
export default class AddressManagerStatus extends ThemeComponent {
    static options = {
        kind: 'empty',
        listId: null,
    }

    init() {
        this.scope.add(bindStatus(this.options.listId, this.el, this.options.kind))
    }
}
