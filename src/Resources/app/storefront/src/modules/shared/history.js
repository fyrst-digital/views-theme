/**
 * Configurable history push / popstate helpers for URL-SoT owners.
 *
 * Domain modules inject key sets and param encode/delete (e.g. listing `|` scalars
 * vs review `points[]`).
 *
 * @module @views-theme/modules/shared/history
 */

/**
 * @typedef {object} HistoryControllerConfig
 * @property {(options: object, controls: Iterable<object>) => Set<string>} getKeys
 * @property {(searchParams: URLSearchParams, key: string, value: string|string[]) => void} [writeParam]
 * @property {(searchParams: URLSearchParams, key: string) => void} [deleteParam]
 * @property {(options: object) => Iterable<string>} [skipKeys]
 */

/**
 * @typedef {object} HistoryController
 * @property {(params: Record<string, string|string[]>, options: object, controls: Iterable<object>) => void} push
 * @property {() => boolean} shouldIgnorePopstate
 */

/**
 * @param {HistoryControllerConfig} config
 * @returns {HistoryController}
 */
export function createHistoryController(config) {
    let ignorePopstate = false

    const writeParam = config.writeParam || defaultWriteParam
    const deleteParam = config.deleteParam || defaultDeleteParam
    const skipKeys = config.skipKeys || (() => [])

    return {
        /**
         * @param {Record<string, string|string[]>} params
         * @param {object} options
         * @param {Iterable<object>} controls
         */
        push(params, options, controls) {
            const skip = new Set(skipKeys(options) || [])
            const keys = config.getKeys(options, controls)
            const url = new URL(window.location.href)

            keys.forEach((key) => {
                deleteParam(url.searchParams, key)
            })

            Object.entries(params || {}).forEach(([key, value]) => {
                if (skip.has(key)) {
                    return
                }
                if (value === null || value === undefined || value === '') {
                    return
                }
                writeParam(url.searchParams, key, value)
            })

            ignorePopstate = true
            window.history.pushState({}, '', url.toString())
            queueMicrotask(() => {
                ignorePopstate = false
            })
        },

        shouldIgnorePopstate() {
            return ignorePopstate
        },
    }
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string} key
 * @param {string|string[]} value
 */
function defaultWriteParam(searchParams, key, value) {
    if (Array.isArray(value)) {
        value.forEach((item) => {
            searchParams.append(key, String(item))
        })
        return
    }
    searchParams.set(key, String(value))
}

/**
 * @param {URLSearchParams} searchParams
 * @param {string} key
 */
function defaultDeleteParam(searchParams, key) {
    searchParams.delete(key)
}
