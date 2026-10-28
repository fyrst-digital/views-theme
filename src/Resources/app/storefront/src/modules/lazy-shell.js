/**
 * Shared mount/wait/unmount helpers for lazy-loaded shell Actions.
 *
 * @module @views-theme/modules/lazy-shell
 */
import { parseHtmlRoot } from '@views-theme/modules/shared/dom.js'
import { releaseShell, shell, whenShellReady } from '@views-theme/modules/shared/shell-registry.js'

export { parseHtmlRoot, replaceMount, unmountEl } from '@views-theme/modules/shared/dom.js'
export { getInstanceByElement, waitForInstance, eventEl } from '@views-theme/modules/shared/component.js'
export { fetchText, beginRequest, abortRequest } from '@views-theme/modules/shared/http.js'
export { shell, whenShellReady, releaseShell } from '@views-theme/modules/shared/shell-registry.js'

/**
 * Mount shell HTML and resolve with its api once the shell component registered.
 * Any previous mount of the same shell id is released first. `releaseShell`
 * removes the mounted root again, even when the shell is nested inside it.
 *
 * @param {string} id  the shell root's `id` (server-rendered)
 * @param {string} html
 * @param {ParentNode} [appendTo]
 * @returns {Promise<import('@views-theme/modules/shared/shell-registry.js').ShellApi|null>}
 */
export async function mountShell(id, html, appendTo = document.body) {
    releaseShell(id)

    const el = parseHtmlRoot(html)
    if (!el) {
        throw new Error('lazy-shell: mount markup is empty')
    }

    appendTo.appendChild(el)
    shell(id).mount = el

    return whenShellReady(id)
}
