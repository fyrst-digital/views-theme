# Cookie consent

Theme-owned cookie bar and cookie manager. They replace the core `CookiePermission` and `CookieConfiguration` PluginManager plugins, which only mount on `[data-cookie-permission]` — the theme bar does not render that attribute, so they never start. Behaviour is unchanged: same `core.basicInformation.*` config, same cookie groups (`frontend.cookie.groups`), same cookies, same `CookieConfiguration_Update` event.

Everything is gated by `core.basicInformation.useDefaultCookieConsent` (`window.useDefaultCookieConsent`). When it is off nothing renders.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Cookie:Bar` (anonymous + JS) | Fixed bottom bar: privacy text, **Configure**, **Only technically required** (`deny`), **Accept all** (when `acceptAllCookies`). Mounted on every page while consent is enabled, so it is also the global coordinator: shows while `cookie-preference` is unset, re-asks when the config hash changed, routes core cookie links and consent requests to the Action. Pads `body` by its own height while visible |
| `Cookie:Manager:Action` (JS) | Lazy shell opener (see [Lazy shells](../conventions/javascript.md#lazy-loaded-shells-critical)). Fetches `frontend.views-theme.cookie.manager` — or `…cookie.consent` for a request — into `#vi-cookie-drawer`, unmounts on close, restores focus to the trigger. Renders a `Button` (`label`, `color`), so it can also be dropped into a footer as a "Cookie settings" button |
| `Cookie:Manager` (class-backed + JS) | The drawer (`Drawer` shell, side `start`) and its form. The class turns core `CookieGroupCollection` into `CookieGroupView` / `CookieEntryView` structs (hidden entries dropped, ids, empty names/descriptions normalised) and resolves `acceptAll` / `privacyPageId` from system config. JS submits: **Save** = `selected`, **Accept all** = `all` |
| `Cookie:Manager:Group` (JS) | One group: an `Accordion:Item` with the group switch beside the expand toggle, entries in the panel. A group that is a cookie itself renders as a single switch. Preselects cookies that are set; keeps the group switch checked / indeterminate in sync |
| `Cookie:Consent` (anonymous + JS) | Per-feature cookie request (wishlist): **Accept**, **Log in**, **Cancel**, **Cookie preferences** (opens the manager). Texts come from the core `cookie.{featureName}.*` snippets |

Class-backed only where there is real view-model work (`Manager`). The bar, consent request and group are composition.

## Flow

```
page load ──► Cookie:Bar (data-visible=false)
                ├─ no cookie-preference ──► show, pad body
                └─ checkConfigurationHash() ──► 'reset' | 'language' ──► show

Bar: deny ──► submitConsent('required') ─┐
Bar: accept ► submitConsent('all')       ├─► set/remove cookies ─► CookieConfiguration_Update ─► hide
Manager: save / accept all ──────────────┘                                          (Manager also closes the drawer)

Configure / core link ──► Action.open() ──► Manager drawer ──► Bar hides (…Manager:Open)
                                          close without preference ──► Bar shows (…Manager:Close)
Wishlist (no cookie) ──► Shopware.emit('ViewsTheme:Cookie:Consent:Request', { featureName, cookieName })
                     ──► Bar ──► Action.open({ consent }) ──► Consent drawer
```

Consent logic lives in `@views-theme/modules/cookie/` (`cookie/*` imports only `shared/*`):

| Module | Role |
|--------|------|
| `cookie/storage.js` | `getCookie` / `setCookie` / `removeCookie` (core `CookieStorageHelper` parity) |
| `cookie/consent.js` | `submitConsent(groupsUrl, mode, { selected, previous })` (`required` \| `all` \| `selected`), `checkConfigurationHash`, `snapshotState`, `isPreferenceSet`. Applies the mode (cookies with a `value` are set with their `expiration`, the rest of the groups removed), stores the config hash per language, publishes `CookieConfiguration_Update` with only the changed cookies (all when there is no `previous` state) and re-runs `registerGoogleReCaptchaPlugins` |

## Routes

| Name | Path | Renders |
|------|------|---------|
| `frontend.views-theme.cookie.manager` | `/vi/cookie/manager` | `Cookie:Manager` (groups from the core `CookieRoute`) |
| `frontend.views-theme.cookie.consent` | `/vi/cookie/consent?featureName=&cookieName=` | `Cookie:Consent` |

`CookieController` extends `AbstractComponentController` (`renderComponent`). The core routes `frontend.cookie.groups` (JSON, consent data) and `frontend.cookie.offcanvas` (link target) are still used; the other core cookie routes and templates are no longer reached by the theme.

## Core contract kept

| Contract | Where |
|----------|-------|
| `CookieConfiguration_Update` on `document.$emitter` — `{ cookieName: boolean }`, changed cookies only | `consent.js` |
| `CookieConfiguration_CloseOffCanvas` after Save / Accept all | `Cookie:Manager` |
| `showCookieBar` / `hideCookieBar` DOM events on `document` (external hooks) | `Cookie:Bar` |
| Links with `href="{frontend.cookie.offcanvas}"` (footer / CMS) open the manager on a plain left click | `Cookie:Bar` |
| `cookie-preference`, `cookie-config-hash` (JSON per language id) | `consent.js` |

## Layout bridge

`storefront/layout/cookie/cookie-permission.html.twig` replaces the core template (the one include for base and `frontend.cookie.permission`) with `<twig:ViewsTheme:Cookie:Bar />`.

## Markup contract

Native controls identify behaviour; no CSS selectors. Manager switches: `input[name="cookie"]` (value = cookie name; **disabled = technically required**) and `input[name="group"]` (group switch). Buttons: `button[name="action"]` with `value` `deny` / `accept` (Bar), `all` / `save` (Manager submit), `accept` / `login` / `cancel` / `preferences` (Consent).

## CSS

`Cookie/Bar.css`: `--vi-cookie-bar-z` (1040, below the drawer's 1045); hidden while `data-visible='false'`. Everything else is CVA (`Bar.cva.twig`, `Manager.cva.twig`, `Manager/Group.cva.twig`, `Consent.cva.twig`). The old `scss/component/cookie.scss` is removed.

## Out of scope

- Changing which cookies exist (`CookieGroupCollectEvent` / app scripts still own that)
- Admin UI for cookie texts (core snippets `cookie.*`)

## Related

- [Wishlist](wishlist.md) — requests consent via `ViewsTheme:Cookie:Consent:Request`
- [Accordion](accordion.md), [Form input](form-input.md) (`Form:Switch`)
- [UX components — class components](../conventions/ux-components.md#class-components-php-backed)
