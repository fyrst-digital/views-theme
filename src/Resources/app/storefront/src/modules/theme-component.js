/**
 * Base class for theme components: `this.scope` is created on first use and
 * disposed in `destroy()` — listeners, bus subscriptions, effects, registry
 * disconnects, observers (`scope.add(() => observer.disconnect())`).
 *
 * `ShopwareComponent` calls `init()` inside its constructor, before subclass
 * field initializers run, so the scope lives in a WeakMap (no `#private` field).
 * A subclass that overrides `destroy()` must call `super.destroy()`.
 *
 * @module @views-theme/modules/theme-component
 */
import { createScope } from '@views-theme/modules/shared/scope.js'

/** @type {WeakMap<object, import('@views-theme/modules/shared/scope.js').Scope>} */
const scopes = new WeakMap()

/**
 * @extends {ShopwareComponent}
 */
export default class ThemeComponent extends ShopwareComponent {
    /**
     * @returns {import('@views-theme/modules/shared/scope.js').Scope}
     */
    get scope() {
        let scope = scopes.get(this)
        if (!scope) {
            scope = createScope()
            scopes.set(this, scope)
        }

        return scope
    }

    destroy() {
        scopes.get(this)?.dispose()
        scopes.delete(this)
    }
}
