/**
 * `node --test --import ./tests/js/setup.mjs`: resolves `@views-theme/modules/*` like the storefront
 * build (jsconfig `paths`). DOM globals are installed per test via `./helpers/dom.mjs`.
 */
import { registerHooks } from 'node:module'

const PREFIX = '@views-theme/modules/'
const modulesRoot = new URL('../../src/Resources/app/storefront/src/modules/', import.meta.url)

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.startsWith(PREFIX)) {
            return nextResolve(new URL(specifier.slice(PREFIX.length), modulesRoot).href, context)
        }

        return nextResolve(specifier, context)
    },
})
