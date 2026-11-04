import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
    waitForInstance,
    waitForComponentsIn,
    waitForMountedTree,
} from '@views-theme/modules/shared/component.js'

/**
 * @param {string} componentName
 * @param {object[]} [descendants]
 */
function createEl(componentName, descendants = []) {
    const el = {
        descendants,
        getAttribute(attr) {
            return attr === 'data-component' ? componentName : null
        },
        matches(selector) {
            return selector === `[data-component="${componentName}"]`
        },
        querySelectorAll(selector) {
            const nested = []
            const walk = (nodes) => {
                for (const child of nodes) {
                    nested.push(child)
                    walk(child.descendants)
                }
            }
            walk(this.descendants)

            if (selector === '[data-component]') {
                return nested.filter((node) => node.getAttribute('data-component'))
            }

            const match = /^\[data-component="([^"]+)"\]$/.exec(selector)
            if (!match) {
                return []
            }

            return nested.filter((node) => node.getAttribute('data-component') === match[1])
        },
    }

    return el
}

/**
 * @param {object[]} roots
 */
function catalogFrom(roots) {
    const catalog = []
    const walk = (nodes) => {
        for (const node of nodes) {
            catalog.push(node)
            walk(node.descendants)
        }
    }
    walk(roots)
    return catalog
}

/**
 * @param {{ delayMs?: number, initialize?: boolean }} [options]
 */
function installShopware({ delayMs = 0, initialize = true } = {}) {
    /** @type {WeakMap<object, Map<string, { componentName: string, el: object }>>} */
    const instances = new WeakMap()
    let catalog = []

    function getInstance(name, el) {
        return instances.get(el)?.get(name) ?? null
    }

    function mount(name, el) {
        const map = instances.get(el) ?? new Map()
        if (!map.has(name)) {
            map.set(name, { componentName: name, el })
        }
        instances.set(el, map)
        return map.get(name)
    }

    globalThis.document = {
        querySelectorAll(selector) {
            const match = /^\[data-component="([^"]+)"\]$/.exec(selector)
            if (!match) {
                return []
            }
            return catalog.filter((node) => node.getAttribute('data-component') === match[1])
        },
    }

    const shopware = {
        getComponentInstanceByElement: getInstance,
        async getComponent(name) {
            if (delayMs) {
                await new Promise((resolve) => {
                    setTimeout(resolve, delayMs)
                })
            }
            return name ? class Component {} : undefined
        },
        async initializeComponent(name) {
            await this.getComponent(name)
            for (const el of document.querySelectorAll(`[data-component="${name}"]`)) {
                mount(name, el)
            }
        },
    }

    if (!initialize) {
        delete shopware.initializeComponent
        delete shopware.getComponent
    }

    globalThis.window = { Shopware: shopware }

    return {
        setCatalog(roots) {
            catalog = catalogFrom(roots)
        },
        mount,
        getInstance,
    }
}

describe('shared/component wait helpers', () => {
    /** @type {ReturnType<typeof installShopware>} */
    let shopware

    beforeEach(() => {
        globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0)
    })

    afterEach(() => {
        delete globalThis.window
        delete globalThis.document
        delete globalThis.requestAnimationFrame
    })

    it('returns immediately when the instance is already mounted', async () => {
        shopware = installShopware()
        const el = createEl('ViewsTheme:Search:Overlay')
        shopware.setCatalog([el])
        shopware.mount('ViewsTheme:Search:Overlay', el)

        const instance = await waitForInstance(
            () => shopware.getInstance('ViewsTheme:Search:Overlay', el),
            { componentName: 'ViewsTheme:Search:Overlay', timeoutMs: 40 },
        )

        assert.equal(instance.el, el)
    })

    it('awaits Shopware.initializeComponent through a cold import longer than 20 frames', async () => {
        shopware = installShopware({ delayMs: 80 })
        const el = createEl('ViewsTheme:Gallery:Fullscreen')
        shopware.setCatalog([el])

        const started = Date.now()
        const instance = await waitForInstance(
            () => shopware.getInstance('ViewsTheme:Gallery:Fullscreen', el),
            { componentName: 'ViewsTheme:Gallery:Fullscreen', timeoutMs: 1000 },
        )

        assert.ok(instance, 'instance should mount after the delayed import')
        assert.ok(Date.now() - started >= 80)
        assert.equal(instance.componentName, 'ViewsTheme:Gallery:Fullscreen')
    })

    it('keeps polling past a fixed 20-frame cap when initializeComponent is missing', async () => {
        shopware = installShopware({ initialize: false })
        const el = createEl('ViewsTheme:Search:Overlay')
        shopware.setCatalog([el])

        let frames = 0
        globalThis.requestAnimationFrame = (callback) => {
            frames += 1
            if (frames === 25) {
                shopware.mount('ViewsTheme:Search:Overlay', el)
            }
            return setTimeout(callback, 0)
        }

        const instance = await waitForInstance(
            () => shopware.getInstance('ViewsTheme:Search:Overlay', el),
            { timeoutMs: 400 },
        )

        assert.ok(instance, 'observer-only mount should still resolve')
        assert.ok(frames >= 25, `expected at least 25 frames, got ${frames}`)
    })

    it('ignores a numeric retries cap so a late mount still resolves', async () => {
        shopware = installShopware({ initialize: false })
        const el = createEl('ViewsTheme:Drawer')
        shopware.setCatalog([el])

        let frames = 0
        globalThis.requestAnimationFrame = (callback) => {
            frames += 1
            if (frames === 5) {
                shopware.mount('ViewsTheme:Drawer', el)
            }
            return setTimeout(callback, 0)
        }

        const instance = await waitForInstance(
            () => shopware.getInstance('ViewsTheme:Drawer', el),
            2,
        )

        assert.ok(instance)
        assert.ok(frames >= 5)
    })

    it('returns null when the time budget elapses without a mount', async () => {
        shopware = installShopware({ initialize: false })
        const el = createEl('ViewsTheme:Search:Overlay')
        shopware.setCatalog([el])

        const instance = await waitForInstance(
            () => shopware.getInstance('ViewsTheme:Search:Overlay', el),
            { timeoutMs: 40 },
        )

        assert.equal(instance, null)
    })

    it('waitForMountedTree waits for nested components such as a drawer panel', async () => {
        shopware = installShopware({ delayMs: 40 })
        const panel = createEl('ViewsTheme:Filter:Panel')
        const drawer = createEl('ViewsTheme:Drawer', [panel])
        shopware.setCatalog([drawer])

        await waitForMountedTree(drawer, { timeoutMs: 1000 })

        assert.ok(shopware.getInstance('ViewsTheme:Drawer', drawer))
        assert.ok(shopware.getInstance('ViewsTheme:Filter:Panel', panel))
    })

    it('waitForComponentsIn includes the root when it matches the name', async () => {
        shopware = installShopware({ delayMs: 20 })
        const overlay = createEl('ViewsTheme:Search:Overlay')
        shopware.setCatalog([overlay])

        await waitForComponentsIn(overlay, ['ViewsTheme:Search:Overlay'], { timeoutMs: 1000 })

        assert.ok(shopware.getInstance('ViewsTheme:Search:Overlay', overlay))
    })

    it('waitForComponentsIn treats missing names as ready', async () => {
        shopware = installShopware()
        const results = createEl('ViewsTheme:Product:Listing:Results')
        shopware.setCatalog([results])

        await waitForComponentsIn(results, ['ViewsTheme:Pagination'], { timeoutMs: 40 })
    })

    it('waitForMountedTree is a no-op for a null root', async () => {
        shopware = installShopware()
        await waitForMountedTree(null, { timeoutMs: 40 })
    })
})
