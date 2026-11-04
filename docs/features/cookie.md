# Cookie consent

Theme-owned cookie bar and cookie manager. They replace the core `CookiePermission` and `CookieConfiguration` PluginManager plugins, which only mount on `[data-cookie-permission]` — the theme bar does not render that attribute, so they never start. Behaviour is unchanged: same `core.basicInformation.*` config, same cookie groups (`frontend.cookie.groups`), same cookies, same `CookieConfiguration_Update` event.

Everything is gated by `core.basicInformation.useDefaultCookieConsent` (`window.useDefaultCookieConsent`). When it is off nothing renders.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Cookie:Bar` (anonymous + JS) | Fixed bottom bar: privacy text, **Configure**, **Only technically required** (`deny`), **Accept all** (when `acceptAllCookies`). Mounted on every page while consent is enabled, so it is also the single coordinator: shows while `cookie-preference` is unset, re-asks when the config hash changed or this language has no consent yet, and opens the manager / a consent request through **its own** nested Action (`openManager()`; core cookie links, `…Manager:Request`, `…Consent:Request`, core `CookieConfiguration/requestConsent`). Moves focus to itself when it appears (not on the privacy page — core parity). Pads `body` by its own height while visible |
| `Cookie:Manager:Action` (JS) | Lazy shell opener (see [Lazy shells](../conventions/javascript.md#lazy-loaded-shells-critical)). Fetches `frontend.views-theme.cookie.manager` — or `…cookie.consent` for a request — into `#vi-cookie-drawer`, unmounts on close, restores focus to the trigger. Renders a `Button` (`label`, `color`), so it can also be dropped into a footer as a "Cookie settings" button. Multi-instance: only the Action that mounted a drawer handles its Open/Close (`eventEl(payload) === own drawer`); it never adopts `#vi-cookie-drawer` by selector. Before mounting it closes a foreign drawer through its owner (Drawer Close event) and swaps its own drawer in place (a replaced manager still emits `…Manager:Close`) |
| `Cookie:Manager` (class-backed + JS) | The drawer (`Drawer` shell, side `start`) and its form. The class turns core `CookieGroupCollection` into `CookieGroupView` / `CookieEntryView` structs (hidden entries dropped, ids, empty names/descriptions normalised) and resolves `acceptAll` / `privacyPageId` from system config. JS submits: **Save** = `selected`, **Accept all** = `all` |
| `Cookie:Manager:Group` (JS) | One group: an `Accordion:Item` with the group switch beside the expand toggle (`aria-label` = `general.expand` + group name, so it is not a second control named like the switch), entries in the panel. A group that is a cookie itself renders as a single switch. Preselects cookies that are set; keeps the group switch checked / indeterminate in sync. The group switch is a plain checkbox (no `role="switch"`) so indeterminate is announced as "mixed"; per-cookie inputs keep `role="switch"`. Group / entry names go through `sw_sanitize` (`Form:Switch` prints `label\|raw`). The group root draws the divider (the `Accordion:Item` border is dropped) |
| `Cookie:Consent` (anonymous + JS) | Per-feature cookie request (wishlist): **Accept**, **Log in**, **Cancel**, **Cookie preferences** (emits `ViewsTheme:Cookie:Manager:Request`; the bar opens the manager). Texts come from the core `cookie.{featureName}.*` snippets |

Class-backed only where there is real view-model work (`Manager`). The bar, consent request and group are composition.

## Flow

```
page load ──► Cookie:Bar (data-visible=false)
                ├─ no cookie-preference ──► show, pad body, focus bar
                └─ checkConfigurationHash() ──► 'reset' | 'language' ──► show

Bar: deny ──► submitConsent('required') ─┐
Bar: accept ► submitConsent('all')       ├─► set/remove cookies ─► CookieConfiguration_Update ─► hide
Manager: save / accept all ──────────────┘                                          (Manager also closes the drawer)

Configure / core link / …Manager:Request ──► Bar.openManager() ──► bar Action.open() ──► Manager drawer ──► Bar hides (…Manager:Open)
                    close without preference ──► Bar shows (…Manager:Close)
                    close, 'language' pending ──► checkConfigurationHash() again ──► still no hash for this language ──► Bar shows
Wishlist (no cookie) ──► Shopware.emit('ViewsTheme:Cookie:Consent:Request', { featureName, cookieName })
core / plugins       ──► document.$emitter.publish('CookieConfiguration/requestConsent', { route, cookieName })
                     ──► Bar ──► Action.open({ consent }) ──► Consent drawer
```

### Language re-consent

`cookie-preference` and the cookies themselves are shared by every language of the domain; `cookie-config-hash` stores one hash per language id. When a preference exists but this language has no hash, core 6.7 shows the bar again **without** resetting (`noConsentForThisLanguage` in `CookieConfiguration._checkCookieConfigurationHash`): a reset would also wipe the consent given in the other language. The theme keeps that (`'language'`, nothing removed, no update event). Unlike core, the bar remembers the open question: closing the manager without saving re-checks the hash and shows the bar again until Deny / Accept all / Save stores the hash for this language. A **changed** hash (`'reset'`) still resets like core: required only, `cookie-preference` removed, `CookieConfiguration_Update`.

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

`CookieController` extends `AbstractComponentController` (`renderComponent`). It takes the `CookieRoute` **service id** typed as `AbstractCookieRoute`, like core `CookieController` (decorators replace that id, so they apply). Consent query values are allowlisted — `featureName` `[A-Za-z0-9_-]+` (snippet key segment), `cookieName` `[A-Za-z0-9._-]+` — and fall back to `wishlist` / `wishlist-enabled`. `cookie/storage.js` additionally refuses to write any name that is not an RFC 6265 token, so a crafted name cannot inject cookie attributes. The core routes `frontend.cookie.groups` (JSON, consent data) and `frontend.cookie.offcanvas` (link target) are still used; the other core cookie routes and templates are no longer reached by the theme.

## Core contract kept

| Contract | Where |
|----------|-------|
| `CookieConfiguration_Update` on `document.$emitter` — `{ cookieName: boolean }`, changed cookies only | `consent.js` |
| `CookieConfiguration/requestConsent` on `document.$emitter` — `{ route, cookieName }` (`featureName` read from the `route` query; core `AddToWishlist`, plugins, apps) | `Cookie:Bar` (subscribed as `…requestConsent.ViewsThemeCookieBar`, unsubscribed on destroy) |
| `CookieConfiguration_CloseOffCanvas` after Save / Accept all | `Cookie:Manager` |
| `showCookieBar` / `hideCookieBar` DOM events on `document` (external hooks) | `Cookie:Bar` |
| Links with `href="{frontend.cookie.offcanvas}"` (footer / CMS) open the manager on a plain left click | `Cookie:Bar` |
| `cookie-preference`, `cookie-config-hash` (JSON per language id) | `consent.js` |

### Not kept

Core `CookieConfiguration` / `CookiePermission` never mount, so their PluginManager APIs do not exist: `PluginManager.getPluginInstances('CookieConfiguration')[0].openOffCanvas()` / `acceptAllCookies()` and friends. Replacements: a link to `frontend.cookie.offcanvas`, a `Cookie:Manager:Action` button, `Shopware.emit('ViewsTheme:Cookie:Manager:Request')`, or the `CookieConfiguration/requestConsent` event. Accept in the consent request only sets the feature cookie (no `CookieConfiguration_Update`) — same as core.

## Layout bridge

`storefront/layout/cookie/cookie-permission.html.twig` replaces the core template (the one include for base and `frontend.cookie.permission`) with `<twig:ViewsTheme:Cookie:Bar />`.

## Twig slots

Child themes swap pieces without replacing the component. Bodies sit in the `Drawer` `content` slot, so every slot is one host deep ([`{% vi_block %}`](../twig/vi-block.md) forwards one level only); the component's props (`views`, `featureName`, `cookieName`, `group`, …) are readable in an override.

| Component | Slots |
|-----------|-------|
| `Cookie:Bar` | `text`, `deny`, `configure`, `accept` |
| `Cookie:Manager` | `intro`, `groups` (the whole `Accordion` — loop `views` with `Cookie:Manager:Group` to inject a group), `actions`, `accept`, `save` |
| `Cookie:Consent` | `description`, `actions`, `accept`, `login`, `cancel`, `preferences` |
| `Cookie:Manager:Group` | `cookie` (single-cookie group), `switch` (group switch), `entries` (the whole `Accordion:Panel`) |

An empty `<twig:block name="…"></twig:block>` hides a slot. Keep the markup contract below in replacements.

## Markup contract

Native controls identify behaviour; no CSS selectors. Manager switches: `input[name="cookie"]` (value = cookie name; **disabled = technically required**) and `input[name="group"]` (group switch, plain checkbox). Buttons: `button[name="action"]` with `value` `deny` / `accept` (Bar), `all` / `save` (Manager submit), `accept` / `login` / `cancel` / `preferences` (Consent).

## CSS

`Cookie/Bar.css`: `--vi-cookie-bar-z` (1040, below the drawer's 1045); hidden while `data-visible='false'`. Everything else is CVA (`Bar.cva.twig`, `Manager.cva.twig`, `Manager/Group.cva.twig`, `Consent.cva.twig`). The old `scss/component/cookie.scss` is removed.

## Tests

- `tests/Unit/Resources/views/components/Cookie/ManagerTest.php` — PHP view-model (hidden entries, empty groups, config defaults)
- `tests/js/modules/cookie/consent.test.mjs` — `submitConsent` modes, required-only, selected names, `previous` diff, per-language hash, reCAPTCHA re-registration; `checkConfigurationHash` reset vs language vs same hash
- `tests/js/modules/cookie/storage.test.mjs` — round trip, cookie-name guard

`npm test` runs the JS tests with the Node test runner (no dependencies, no build). `tests/js/setup.mjs` resolves `@views-theme/modules/*`; `tests/js/helpers/dom.mjs` fakes `document.cookie`, `document.$emitter`, `window.location` and `fetch`.

## Out of scope

- Changing which cookies exist (`CookieGroupCollectEvent` / app scripts still own that)
- Admin UI for cookie texts (core snippets `cookie.*`)

## Related

- [Wishlist](wishlist.md) — requests consent via `ViewsTheme:Cookie:Consent:Request`
- [Accordion](accordion.md), [Form input](form-input.md) (`Form:Switch`)
- [UX components — class components](../conventions/ux-components.md#class-components-php-backed)
