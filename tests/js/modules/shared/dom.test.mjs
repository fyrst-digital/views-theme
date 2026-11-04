import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { mountTemplate } from '@views-theme/modules/shared/dom.js'

/**
 * Minimal node: `remove`, `appendChild`, `isConnected` via the parent chain.
 *
 * @param {string} name
 */
function createNode(name) {
    return {
        name,
        parent: null,
        children: [],
        appendChild(child) {
            child.parent = this
            this.children.push(child)
            return child
        },
        remove() {
            if (this.parent) {
                this.parent.children = this.parent.children.filter((c) => c !== this)
                this.parent = null
            }
        },
    }
}

/**
 * Fake `document`: `<template>` lookup by id, `importNode` clone, selector lookup on body children.
 *
 * @param {Record<string, { content: { firstElementChild: object|null } }>} templates
 */
function installDocument(templates = {}) {
    const body = createNode('body')
    const imported = []

    globalThis.document = {
        body,
        getElementById(id) {
            return templates[id] ?? null
        },
        importNode(node, deep) {
            assert.equal(deep, true)
            const clone = createNode(node.name)
            imported.push({ source: node, clone })
            return clone
        },
        querySelector(selector) {
            return body.children.find((child) => child.name === selector) ?? null
        },
    }

    return { body, imported }
}

describe('mountTemplate', () => {
    beforeEach(() => {
        delete globalThis.document
    })

    afterEach(() => {
        delete globalThis.document
    })

    it('appends a fresh clone of the template root and keeps the template intact', () => {
        const source = createNode('#vi-shell')
        const { body, imported } = installDocument({ 'vi-shell-template': { content: { firstElementChild: source } } })

        const el = mountTemplate('vi-shell-template', '#vi-shell')

        assert.equal(imported.length, 1)
        assert.equal(imported[0].source, source)
        assert.notEqual(el, source)
        assert.deepEqual(body.children, [el])
    })

    it('replaces a leftover mount instead of stacking a second one', () => {
        const source = createNode('#vi-shell')
        const { body } = installDocument({ 'vi-shell-template': { content: { firstElementChild: source } } })

        const first = mountTemplate('vi-shell-template', '#vi-shell')
        const second = mountTemplate('vi-shell-template', '#vi-shell')

        assert.notEqual(first, second)
        assert.deepEqual(body.children, [second])
        assert.equal(first.parent, null)
    })

    it('throws when the template is missing or empty', () => {
        installDocument({ empty: { content: { firstElementChild: null } } })

        assert.throws(() => mountTemplate('missing', '#vi-shell'), /"missing" is missing or empty/)
        assert.throws(() => mountTemplate('empty', '#vi-shell'), /"empty" is missing or empty/)
    })
})
