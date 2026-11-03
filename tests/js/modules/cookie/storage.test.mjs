import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { installDom, uninstallDom } from '../../helpers/dom.mjs'
import { getCookie, isValidCookieName, removeCookie, setCookie } from '@views-theme/modules/cookie/storage.js'

describe('cookie/storage', () => {
    /** @type {ReturnType<typeof installDom>} */
    let dom

    beforeEach(() => {
        dom = installDom()
    })

    afterEach(() => {
        uninstallDom()
    })

    it('round-trips a cookie', () => {
        setCookie('wishlist-enabled', '1', 30)

        assert.equal(getCookie('wishlist-enabled'), '1')
        assert.equal(getCookie('wishlist'), null, 'prefix of another name does not match')

        removeCookie('wishlist-enabled')
        assert.equal(getCookie('wishlist-enabled'), null)
    })

    it('accepts cookie-name tokens', () => {
        for (const name of ['cookie-preference', '_ga', 'my.plugin_cookie', 'session-']) {
            assert.equal(isValidCookieName(name), true, name)
        }
    })

    it('refuses names that would inject cookie attributes', () => {
        const error = console.error
        console.error = () => {}

        try {
            for (const name of ['x;domain=evil.test', 'a b', 'a=b', '', null]) {
                assert.equal(isValidCookieName(name), false, String(name))
                setCookie(/** @type {any} */ (name), '1', 30)
            }
        } finally {
            console.error = error
        }

        assert.equal(dom.jar.size, 0)
    })
})
