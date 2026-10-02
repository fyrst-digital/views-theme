# Newsletter

Public subscribe form for guests and logged-in customers. Compose `<twig:ViewsTheme:Newsletter:Form>` where it is needed. It is not mounted in the [footer](footer.md). The CMS newsletter element stays the core include.

Logged-in account opt-in stays [`Account:Newsletter`](account.md) (`frontend.account.newsletter`). This form does not replace that switch.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Newsletter:Form` | Email, privacy, captcha, submit. Owns the JSON POST |
| `Newsletter:Form:Messages` | Renders the route's `{ type, alert }` list as `ViewsTheme:Alert` |
| `Newsletter:Form:Messages:Sample` | Hidden `<template>` per alert type, cloned by Messages |
| `Form:Handler` | Constraint validation + submit loading (`preventNative`) |
| `Form:Input:Group` | Email field; submit `Button` in `append` |
| `Privacy:Note` | Required consent checkbox (unique id; `requireCheckbox` forced on). Rendered only when `privacyNote` is true (default) |
| Core captcha include | `storefront/component/captcha/base.html.twig` |

Do **not** mount core `data-form-cms-handler` / `data-form-ajax-submit` / `FormCmsHandler`.

## Composition

```
Newsletter:Form
├─ Newsletter:Form:Messages
│    └─ Newsletter:Form:Messages:Sample × success | info | warning | danger
└─ Form:Handler  (preventNative, POST frontend.form.newsletter.register.handle)
     ├─ csrf + hidden option=subscribe
     ├─ Form:Input:Group (email)
     │    └─ Button (append)
     ├─ core captcha
     └─ Privacy:Note  (when privacyNote, default true)
```

`privacyNote` (default `true`) gates the `Privacy:Note` call inside `{% vi_block privacy %}`. `:privacyNote="false"` skips the component. The `privacy` nest, `privacyId`, and CVA stay in place.

Nests: `messages`, `form`, `email`, `privacy`, `submit`.

## Route

`POST /form/newsletter` (`frontend.form.newsletter.register.handle`) is `XmlHttpRequest` and `_captcha`. A navigation POST returns JSON, not a storefront page. `Newsletter:Form` sends `FormData` with `X-Requested-With: XMLHttpRequest`.

The controller reads `option=subscribe` (`FormController::SUBSCRIBE`) and sets `storefrontUrl` itself. The JSON body is a list of `{ type, alert }`. Success `alert` is plain text. Danger, info, and rate-limit `alert` values are HTML from core `alert.html.twig`. Messages keeps the text (list items when the HTML has them) and clones a theme `Alert`. It does not insert the core alert markup.

Reset the fields only when every item is `type: success` (same rule as core `FormCmsHandler`). A persisted subscribe also returns an info alert, so the email stays filled and both alerts show.

## Captcha

Basic captcha and Google reCAPTCHA call `form.submit()` after their token check. That native call does not fire `submit` again, and those plugins only look for a PluginManager form plugin with `sendAjaxFormSubmit`. `Newsletter:Form` replaces **this form's** `submit` so that call stays on the JSON route, and restores it in `destroy()`.

When one of those widgets is in the form (`data-basic-captcha`, `data-google-re-captcha-v2`, `data-google-re-captcha-v3`), the component does not post from `ViewsTheme:Form:Handler:Submit`. It posts from the replaced `submit()`. Honeypot does not take over submit, so that case posts from the handler event.

## Related

- [Account pages](account.md) (`Account:Newsletter`)
- [Form input](form-input.md) (`Form:Handler`, `Form:Input:Group`)
- [Footer](footer.md)
