/**
 * Minimal browser globals for module tests: a `document.cookie` jar (expiry + overwrite), a
 * recording `document.$emitter`, `window.location` and a `fetch` stub.
 */

/**
 * @param {{ origin?: string }} [options]
 * @returns {{ jar: Map<string, string>, published: { eventName: string, detail: unknown }[], respond: (body: unknown, ok?: boolean) => void, requests: string[] }}
 */
export function installDom({ origin = 'https://shop.test' } = {}) {
    const jar = new Map()
    const published = []
    const requests = []
    let response = { body: null, ok: true }

    globalThis.document = {
        get cookie() {
            return [...jar].map(([name, value]) => `${name}=${value}`).join('; ')
        },
        set cookie(raw) {
            const [pair, ...attributes] = String(raw).split(';')
            const separator = pair.indexOf('=')
            const name = pair.slice(0, separator).trim()
            const value = pair.slice(separator + 1)
            const expires = attributes.map((part) => part.trim()).find((part) => part.toLowerCase().startsWith('expires='))

            if (expires && new Date(expires.slice('expires='.length)).getTime() <= Date.now()) {
                jar.delete(name)
                return
            }

            jar.set(name, value)
        },
        $emitter: {
            publish(eventName, detail) {
                published.push({ eventName, detail })
            },
        },
    }

    globalThis.window = { location: new URL(`${origin}/`) }

    globalThis.fetch = async (url) => {
        requests.push(String(url))

        return {
            ok: response.ok,
            status: response.ok ? 200 : 500,
            json: async () => structuredClone(response.body),
        }
    }

    return {
        jar,
        published,
        requests,
        respond(body, ok = true) {
            response = { body, ok }
        },
    }
}

export function uninstallDom() {
    delete globalThis.document
    delete globalThis.window
    delete globalThis.fetch
}
