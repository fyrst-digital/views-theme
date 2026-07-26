# Navigation drawer

Lazy-loaded side drawer for the main category navigation, opened from the header menu action.

All UI lives under UX components (`components/Drawer/*`, `components/Navigation/Drawer/*`). Markup is served by theme routes under `/vi/…` — not core `/widgets/menu/offcanvas`.

Desktop navbar stays core for now; this feature owns the header **menu** action and mobile-style drill-down navigation.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Navigation:Drawer:Action` | Lazy fetch/mount; toggle `Drawer` open/close |
| `Navigation:Drawer` | Thin composition — **no** JS. Overrides Drawer `panel` + Panel `header`; Header `title` hosts `Wishlist:Action` + `Account:Action`; footer hosts `Language:Action` + `Currency:Action`; Menu is Panel body |
| `Drawer` | Shell: open/close a11y, motion; default empty `panel` (Panel with `title` prop); no body content slot |
| `Drawer:Panel` | Sliding surface + header/body; owns `{% block content %}`; body is flex column (`min-h-0 overflow-hidden`) so nested scrollports can fill; composes `Header` via `title` prop (overridable); JS notifies Drawer on close `transitionend` |
| `Drawer:Header` | Presentational chrome: title slot + `Drawer:Close` (no JS) |
| `Drawer:Backdrop` / `Drawer:Close` | `callMethod(Drawer, close)` |
| `Navigation:Drawer:Menu` | Drill-down fetch, cache, level slide; composes `Scroll:Area` as scrollport |
| `Navigation:Drawer:Menu:Header` | Non-root level chrome: Back + ShowAll + Active (presentational) |
| `Navigation:Drawer:Item` | Category row: label link → category; caret `Drill` → submenu (caret only if children) |
| `Navigation:Drawer:Drill` | Emits menu drill event with `{ url, source, direction }` |

## Features

- Header `Navigation:Drawer:Action` (list icon) opens the navigation drawer on click
- Drawer shell lifecycle (hard rule): **(re)fetch on every open**, **remove from DOM when close finishes** — never cache HTML or keep a closed mount (see [JS conventions](../conventions/javascript.md#lazy-loaded-drawer-shells-critical))
- Generic `ViewsTheme:Drawer` primitive owns open/close, backdrop, Escape, focus trap, body scroll lock
- Open/close motion: panel slides from `side`, backdrop fades (`--vi-drawer-duration`, default 250ms); `prefers-reduced-motion: reduce` skips transitions
- Drawer header title hosts `Wishlist:Action` (when enabled) + `Account:Action` with default visible labels; close stays on the right
- Drawer footer hosts `Language:Action` + `Currency:Action` (`position="offcanvas"`, `placement="top-start"`); languages/currencies loaded via `HeaderPageletLoader` in the drawer controller
- Below `lg`, header wishlist is `d-none d-lg-inline-flex`; header account uses Dropdown `host:class="vi-dropdown-host--lg-up"`; use the drawer actions instead
- Header instances pass `:label="false"` (icon-only); drawer keeps default label snippets (`header.wishlist` / `account.myAccount`)
- Navigation levels use core-style **drill-down** (depth 1 per request) via `MenuOffcanvasPageletLoader`
- Item label opens the category; optional `vi_navigation_image` thumb before the label; caret drills deeper; no caret when the category has no children
- Close via `Drawer:Close` / `Drawer:Backdrop`, Escape, or toggling the action again
- Focus returns to the action after the close transition finishes

### Header actions in the drawer title

`Navigation:Drawer` overrides Panel `header` → `Drawer:Header` → `title` with icon+label actions (not the scalar `title` prop). Drawer root keeps `label` for `aria-label`.

`Wishlist:Action` / `Account:Action` `label` prop defaults to a translated snippet; `:label="false"` hides the text. Drawer uses defaults; header hides labels.

Wishlist uses drawer-scoped ids so it can coexist with the header instance:

| Element | Header (default) | Drawer |
|---------|------------------|--------|
| Badge | `wishlist-basket` | `vi-navigation-drawer-wishlist-basket` |
| Live region | `wishlist-basket-live-area` | `vi-navigation-drawer-wishlist-live` |

Wire-up: `Page:Header:Actions` (desktop) and `Navigation:Drawer` title (mobile entry).

## How it works

### Open flow

1. `ViewsTheme:Navigation:Drawer:Action` reads `drawerUrl` from `data-component-options`
2. If Drawer is already open → `close()` only (no fetch); close finishes → Action **unmounts** `#vi-navigation-drawer`
3. Otherwise **always** fetches `frontend.views-theme.navigation.drawer` (optional `navigationId` from `window.activeNavigationId`)
4. Response root is `ViewsTheme:Drawer` (`#vi-navigation-drawer`); any leftover mount is removed, then the new root is appended to `document.body`
5. Drawer + Panel + Menu + Drill children initialize; Action opens Drawer
6. Drawer emits `ViewsTheme:Drawer:Open` via `Shopware.emitQueued`; Action sets `aria-expanded`
7. On `ViewsTheme:Drawer:Close`: Action sets `aria-expanded`, returns focus, **removes** the drawer root (next open is a full fetch + mount)

### Menu item interaction

- **Label** (`Item` link): navigates to the category page (`category_url`). Folders use `#` (no listing).
- **Image** (optional): category custom field `vi_navigation_image` (media UUID). When set, Menu batch-resolves media via `searchMedia` and passes it to Item; Item renders a thumb before the label inside the link. Omitted when unset.
- **Caret** (`Item` → `Drill`, only when `visibleChildCount > 0`): drills into the submenu; omitted for leaf categories.
- **Back** / **ShowAll**: full-row `Drill` with `direction: back`; ShowAll label `viewsTheme.navigationDrawer.showAll` (en: “Show all”)
- **Active**: “show category” link to the current level’s category page (after ShowAll in the level header)

### Category navigation image

| Piece | Detail |
|-------|--------|
| Custom field | `vi_navigation_image` on category (media type, translated) |
| Resolve | `Menu` collects IDs from the current level → `searchMedia(ids, context.context)` once |
| Render | `Item` prop `image`; `{% sw_thumbnails %}` before label when present |
| Image tokens | `--vi-navigation-drawer-item-image-size` (`1.75rem`), `--vi-navigation-drawer-item-image-radius` (`0.25rem`), `--vi-navigation-drawer-item-image-aspect-ratio` (`1 / 1`), `--vi-navigation-drawer-item-image-fit` (`cover`) |

### Drill-down flow

1. `Navigation:Drawer:Drill` (Item caret, Back, ShowAll) handles click
2. Drill `emit`s `ViewsTheme:Navigation:Drawer:Menu:Drill` with `{ url, source, direction }` (`forward` default; Back/ShowAll pass `back`)
3. Menu listens, ignores events whose `source` is outside itself; single `_busy` flight covers fetch + slide
4. Fetches/caches HTML, parses with `<template>`, takes `:scope > [data-level]`
5. Level motion (see below)

### Level motion

- Flex scroll chain: Panel body (`min-h-0` + `overflow-hidden` + column flex) → Menu (`col` + `min-h-0` + `overflow-hidden`) → nested `Scroll:Area` (`flex-1 min-h-0`, edge fades) so long levels scroll inside the panel
- Menu owns drill orchestration; `Scroll:Area` is the scrollport (not Menu root) — same composition pattern as Search results
- Menu body is a single `[data-level]` surface inside `Scroll:Area`; drill keeps the outgoing level and appends the incoming one to the scrollport
- After each level swap, scroll resets to top and Scroll:Area edge flags re-sync
- Two-phase slide: set `data-direction` + level states `from`/`enter` (absolute `inset: 0` in the relative scrollport, no transition) → set `data-animating` → flip to `out`/`in`
- Scrollport (`.vi-navigation-drawer-menu__scroll`) uses `flex: 1 1 0` + `min-height: 0` so height comes from the Menu column, not content — levels can be absolute without a JS height lock
- Forward: outgoing exits start-ward (`-100%`), incoming enters from end; back is the reverse
- Levels use an opaque body background and incoming stacks above outgoing so labels never show through
- Token: `--vi-navigation-drawer-menu-duration` (default `250ms`) — CSS is SoT; JS reads it for the transform fallback
- Outgoing is `inert` during the slide
- `prefers-reduced-motion: reduce` skips the slide and swaps the level immediately

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.navigation.drawer` | `/vi/navigation/drawer` | `GET` (XHR) |
| `frontend.views-theme.navigation.drawer.menu` | `/vi/navigation/drawer/menu` | `GET` (XHR) |

Both load `MenuOffcanvasPageletLoader`, dispatch `MenuOffcanvasPageletLoadedHook`, then render UX components via `ComponentRendererInterface`.

## Hooks

| Component | Attribute |
|-----------|-----------|
| Action button | `data-component="ViewsTheme:Navigation:Drawer:Action"` |
| Drawer root (mount) | `data-component="ViewsTheme:Drawer"` / `#vi-navigation-drawer` |
| Panel | `data-component="ViewsTheme:Drawer:Panel"` |
| Backdrop | `data-component="ViewsTheme:Drawer:Backdrop"` |
| Close | `data-component="ViewsTheme:Drawer:Close"` |
| Menu | `data-component="ViewsTheme:Navigation:Drawer:Menu"` |
| Menu scrollport | `data-component="ViewsTheme:Scroll:Area"` (nested under Menu) |
| Drill | `data-component="ViewsTheme:Navigation:Drawer:Drill"` |

Action options (`data-component-options`): `drawerUrl`.

Events:

- `ViewsTheme:Drawer:Open` / `:Close` (payload: drawer element)
- `ViewsTheme:Navigation:Drawer:Menu:Drill` (payload: `{ url, source, direction }`)

See [JavaScript conventions](../conventions/javascript.md).

## Generic Drawer

`ViewsTheme:Drawer` is reusable (side `start` \| `end`, `title` prop, Panel/Backdrop/Close). Callers that need a body override the `panel` block and put content on `Drawer:Panel` (no multi-hop block capture). Navigation does this; other features may reuse the same pattern later.

### Motion

- Root uses `data-side` + `data-open` (`true`/`false`); CSS in `Drawer.css` drives slide/fade
- `open()` shows the layer, reflows, then sets `data-open="true"`
- `close()` sets `data-open="false"`; `Drawer:Panel` calls `onPanelTransitionEnd` on transform end (timeout fallback remains)
- Token: `--vi-drawer-duration` (default `250ms`) — CSS is SoT; JS reads via options `durationVar` / `durationFallback` for the close timeout

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/NavigationDrawerController.php` |
| Drawer primitive | `src/Resources/views/components/Drawer.*` |
| Panel / Header / Backdrop / Close | `src/Resources/views/components/Drawer/{Panel,Header,Backdrop,Close}.*` |
| Navigation compose | `src/Resources/views/components/Navigation/Drawer.html.twig` |
| Action | `src/Resources/views/components/Navigation/Drawer/Action.*` |
| Menu (+ drill orchestration / level motion) | `src/Resources/views/components/Navigation/Drawer/Menu.*` |
| Scroll area (menu scrollport) | `src/Resources/views/components/Scroll/Area.*` |
| Drill | `src/Resources/views/components/Navigation/Drawer/Drill.*` |
| Menu header | `src/Resources/views/components/Navigation/Drawer/Menu/Header.*` |
| Items | `src/Resources/views/components/Navigation/Drawer/{Item,Back,ShowAll,Active}.*` |
| Header wire-up | `src/Resources/views/components/Page/Header/Actions.html.twig` |

## Out of scope (v1)

- Replacing the desktop core navbar
- Migrating cart/cookie offcanvas onto `Drawer`
- Reopening the theme drawer after language/currency switch (`redirectParameters[offcanvas]=menu` still targets core offcanvas param)
