# Navigation drawer

Lazy-loaded side drawer for the main category navigation, opened from the header menu action.

All UI lives under UX components (`components/Drawer/*`, `components/Navigation/Drawer/*`). Markup is served by theme routes under `/vi/…` — not core `/widgets/menu/offcanvas`.

Desktop navbar stays core for now; this feature owns the header **menu** action and mobile-style drill-down navigation.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Navigation:Drawer:Action` | Lazy fetch/mount; toggle `Drawer` open/close |
| `Navigation:Drawer` | Thin composition — **no** JS. Overrides Drawer `panel` block; mounts `Drawer:Panel` with `title` + Menu as Panel default content |
| `Drawer` | Shell: open/close a11y, motion; default empty `panel` (Panel with `title` prop); no body content slot |
| `Drawer:Panel` | Sliding surface + header/body; owns `{% block content %}`; composes `Header` via `title` prop; JS notifies Drawer on close `transitionend` |
| `Drawer:Header` | Presentational chrome: title div + `Drawer:Close` via `title` prop (no JS) |
| `Drawer:Backdrop` / `Drawer:Close` | `callMethod(Drawer, close)` |
| `Navigation:Drawer:Menu` | Drill-down fetch, cache, level replace, focus |
| `Navigation:Drawer:Drill` | Emits menu drill event with `{ url, source }` |

## Features

- Header `Navigation:Drawer:Action` (list icon) opens the navigation drawer on click
- Drawer HTML is fetched once from a theme route and cached client-side
- Generic `ViewsTheme:Drawer` primitive owns open/close, backdrop, Escape, focus trap, body scroll lock
- Open/close motion: panel slides from `side`, backdrop fades (`--vi-drawer-duration`, default 250ms); `prefers-reduced-motion: reduce` skips transitions
- Navigation levels use core-style **drill-down** (depth 1 per request) via `MenuOffcanvasPageletLoader`
- Close via `Drawer:Close` / `Drawer:Backdrop`, Escape, or toggling the action again
- Focus returns to the action after the close transition finishes

## How it works

### Open flow

1. `ViewsTheme:Navigation:Drawer:Action` reads `drawerUrl` from `data-component-options`
2. First click fetches `frontend.views-theme.navigation.drawer` (optional `navigationId` from `window.activeNavigationId`)
3. Response root is `ViewsTheme:Drawer` (`#vi-navigation-drawer`); appended to `document.body`
4. Drawer + Panel + Menu + Drill children initialize; Action opens Drawer
5. Drawer emits `ViewsTheme:Drawer:Open` via `Shopware.emitQueued`; Action sets `aria-expanded`
6. Subsequent clicks toggle via `getComponentInstanceByElement` + `open()` / `close()`

### Drill-down flow

1. `Navigation:Drawer:Drill` (Item with children, Back, ShowAll) handles click
2. Drill `emit`s `ViewsTheme:Navigation:Drawer:Menu:Drill` with `{ url, source }`
3. Menu listens, ignores events whose `source` is outside itself, fetches/caches HTML
4. Parses with `<template>`, keeps Menu root, applies level via `replaceChildren(...next.children)`
5. Focus moves to ShowActive link, else first Drill, else first focusable

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
| Drill | `data-component="ViewsTheme:Navigation:Drawer:Drill"` |
| Show active | `data-component="ViewsTheme:Navigation:Drawer:ShowActive"` |

Action options (`data-component-options`): `drawerUrl`.

Events:

- `ViewsTheme:Drawer:Open` / `:Close` (payload: drawer element)
- `ViewsTheme:Navigation:Drawer:Menu:Drill` (payload: `{ url, source }`)

See [JavaScript conventions](../conventions/javascript.md).

## Generic Drawer

`ViewsTheme:Drawer` is reusable (side `start` \| `end`, `title` prop, Panel/Backdrop/Close). Callers that need a body override the `panel` block and put content on `Drawer:Panel` (no multi-hop block capture). Navigation does this; other features may reuse the same pattern later.

### Motion

- Root uses `data-side` + `data-open` (`true`/`false`); CSS in `Drawer.css` drives slide/fade
- `open()` shows the layer, reflows, then sets `data-open="true"`
- `close()` sets `data-open="false"`; `Drawer:Panel` calls `onPanelTransitionEnd` on transform end (duration fallback remains)
- Token: `--vi-drawer-duration` (default `250ms`)

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/NavigationDrawerController.php` |
| Drawer primitive | `src/Resources/views/components/Drawer.*` |
| Panel / Header / Backdrop / Close | `src/Resources/views/components/Drawer/{Panel,Header,Backdrop,Close}.*` |
| Navigation compose | `src/Resources/views/components/Navigation/Drawer.html.twig` |
| Action | `src/Resources/views/components/Navigation/Drawer/Action.*` |
| Menu (+ drill orchestration) | `src/Resources/views/components/Navigation/Drawer/Menu.*` |
| Drill | `src/Resources/views/components/Navigation/Drawer/Drill.*` |
| Items | `src/Resources/views/components/Navigation/Drawer/{Item,Back,ShowAll,Active,ShowActive}.*` |
| Header wire-up | `src/Resources/views/components/Page/Header/Actions.html.twig` |

## Out of scope (v1)

- Replacing the desktop core navbar
- Migrating cart/cookie offcanvas onto `Drawer`
- Reopening via `?offcanvas=menu` (LanguageSwitch still targets core)
