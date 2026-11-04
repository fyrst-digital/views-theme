import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { mountComponents } from '@views-theme/modules/shared/component.js'

/**
 * Minimal element: `data-component`, descendants in document order, `isConnected`.
 *
 * @param {string|null} componentName
 * @param {object[]} [children]
 */
function createEl(componentName, children = []) {
    return {
        children,
        isConnected: true,
        getAttribute(attr) {
            return attr === 'data-component' ? componentName : null
        },
        querySelectorAll(selector) {
            assert.equal(selector, '[data-component]')
            const found = []
            const walk = (nodes) => {
                for (const node of nodes) {
                    if (node.getAttribute('data-component')) {
                        found.push(node)
                    }
                    walk(node.children)
                }
            }
            walk(this.children)
            return found
        },
    }
}

/**
 * Fake `window.Shopware` with the core semantics `mountComponents` relies on:
 * `getComponent` awaits an import (per-name delay, `null` = failed import) and
 * `initializeComponentOnElement` is idempotent per element + name.
 *
 * @param {{ delays?: Record<string, number|null>, throws?: string[] }} [options]
 */
function installShopware({ delays = {}, throws = [] } = {}) {
    const instances = new Map()
    /** @type {string[]} */
    const mounted = []
    /** @type {string[]} */
    const imports = []

    const shopware = {
        getComponentInstanceByElement(name, el) {
            return instances.get(el)?.get(name)
        },
        async getComponent(name) {
            imports.push(name)
            if (delays[name] === null) {
                return undefined
            }
            await new Promise((resolve) => {
                setTimeout(resolve, delays[name] ?? 0)
            })
            return class {}
        },
        initializeComponentOnElement(name, component, el) {
            const existing = this.getComponentInstanceByElement(name, el)
            if (existing) {
                return existing
            }
            if (throws.includes(name)) {
                throw new Error(`${name} constructor failed`)
            }
            const instance = new component()
            const byName = instances.get(el) ?? new Map()
            byName.set(name, instance)
            instances.set(el, byName)
            mounted.push(name)
            return instance
        },
    }

    globalThis.window = { Shopware: shopware }

    return { shopware, mounted, imports }
}

describe('shared/component mountComponents', () => {
    /** @type {typeof console.error} */
    let consoleError
    /** @type {unknown[][]} */
    let errors

    beforeEach(() => {
        consoleError = console.error
        errors = []
        console.error = (...args) => {
            errors.push(args)
        }
    })

    afterEach(() => {
        console.error = consoleError
        delete globalThis.window
    })

    it('mounts the root and nested components after a slow (cold) import', async () => {
        const { shopware } = installShopware({ delays: { 'Shell': 60, 'Panel': 30 } })
        const panel = createEl('Panel')
        const root = createEl('Shell', [createEl(null, [panel])])

        await mountComponents(root)

        assert.ok(shopware.getComponentInstanceByElement('Shell', root))
        assert.ok(shopware.getComponentInstanceByElement('Panel', panel))
    })

    it('instantiates in document order even when a child chunk resolves first', async () => {
        const { mounted } = installShopware({ delays: { 'Shell': 40, 'Panel': 0, 'Close': 10 } })
        const root = createEl('Shell', [createEl('Panel'), createEl('Close')])

        await mountComponents(root)

        assert.deepEqual(mounted, ['Shell', 'Panel', 'Close'])
    })

    it('imports each component name once', async () => {
        const { imports } = installShopware()
        const root = createEl('List', [createEl('Item'), createEl('Item'), createEl('Item')])

        await mountComponents(root)

        assert.deepEqual(imports.sort(), ['Item', 'List'])
    })

    it('limits mounting to the given component names', async () => {
        const { mounted, imports } = installShopware()
        const root = createEl('Results', [createEl('Pagination'), createEl('ProductBox')])

        await mountComponents(root, ['Pagination', 'Sorting'])

        assert.deepEqual(mounted, ['Pagination'])
        assert.deepEqual(imports, ['Pagination'])
    })

    it('reuses instances the MutationObserver already created', async () => {
        const { shopware, mounted } = installShopware()
        const root = createEl('Shell')
        const existing = shopware.initializeComponentOnElement('Shell', class {}, root)

        await mountComponents(root)

        assert.equal(shopware.getComponentInstanceByElement('Shell', root), existing)
        assert.deepEqual(mounted, ['Shell'])
    })

    it('skips nodes removed from the document while chunks load', async () => {
        const { mounted } = installShopware({ delays: { 'Shell': 20 } })
        const root = createEl('Shell')

        const pending = mountComponents(root)
        root.isConnected = false
        await pending

        assert.deepEqual(mounted, [])
    })

    it('resolves without waiting when an import fails', async () => {
        const { shopware, mounted } = installShopware({ delays: { 'Broken': null } })
        const broken = createEl('Broken')
        const root = createEl('Shell', [broken])

        await mountComponents(root)

        assert.deepEqual(mounted, ['Shell'])
        assert.equal(shopware.getComponentInstanceByElement('Broken', broken), undefined)
    })

    it('keeps mounting siblings when one constructor throws', async () => {
        const { mounted } = installShopware({ throws: ['Broken'] })
        const root = createEl('Shell', [createEl('Broken'), createEl('Close')])

        await mountComponents(root)

        assert.deepEqual(mounted, ['Shell', 'Close'])
        assert.equal(errors.length, 1)
    })

    it('is a no-op for a missing or detached root', async () => {
        const { imports } = installShopware()
        const detached = createEl('Shell')
        detached.isConnected = false

        await mountComponents(null)
        await mountComponents(undefined)
        await mountComponents(detached)

        assert.deepEqual(imports, [])
    })

    it('is a no-op without window.Shopware', async () => {
        globalThis.window = {}

        await mountComponents(createEl('Shell'))
    })
})
