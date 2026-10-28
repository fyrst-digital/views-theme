/**
 * Newsletter form messages, keyed by the form id rendered by Twig (the footer and a
 * page can both host a form). `Newsletter:Form` publishes the route response items;
 * `Newsletter:Form:Messages` renders them.
 *
 * @module @views-theme/modules/newsletter/store
 */
import { createStore } from '@views-theme/modules/shared/store.js'

/**
 * @typedef {{ items: Array<{ type?: string, alert?: string }> }} NewsletterMessages
 */

/** `messages` gets a fresh object per response, so an identical response renders again. */
export const newsletterForms = createStore({
    messages: /** @type {NewsletterMessages} */ ({ items: [] }),
})
