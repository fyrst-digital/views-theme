# Navigation drawer

Lazy-loaded side drawer for the main category navigation, opened from the header menu action.

All UI lives under UX components (`components/Drawer/*`, `components/Navigation/Drawer/*`). Markup is served by theme routes under `/vi/…` — not core `/widgets/menu/offcanvas`.

Desktop navbar stays core for now; this feature owns the header **menu** action and mobile-style drill-down navigation.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Navigation:Drawer:Action` | Lazy fetch/mount; toggle `Drawer` open/close |
| `Navigation:Drawer` | Thin composition: `Drawer` as root + Menu (Account:Action → Dropdown pattern) — **no** JS |
| `Drawer` | Panel chrome, open/close a11y, motion (mount root) |
| `Navigation:Drawer:Menu` | Drill-down fetch, cache, level replace, focus |

## Features

- Header `Navigation:Drawer:Action` (list icon) opens the navigation shell on click
- Shell HTML is fetched once from a theme route and cached client-side
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
4. Drawer + nested `Navigation:Drawer:Menu` initialize; Action opens Drawer
5. Drawer emits `ViewsTheme:Drawer:Open` via `Shopware.emitQueued`; Action sets `aria-expanded`
6. Subsequent clicks toggle via `getComponentInstanceByElement` + `open()` / `close()`

### Drill-down flow

1. Category rows with children use `data-action="drill"` and `data-href` pointing at the menu route
2. **`Navigation:Drawer:Menu`** intercepts the click, fetches menu HTML, caches by URL
3. Parses the response with `<template>`, keeps the Menu component root, applies level via `replaceChildren(...next.children)`
4. Back / “main menu” links use the same drill action

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
| Backdrop | `data-component="ViewsTheme:Drawer:Backdrop"` |
| Close | `data-component="ViewsTheme:Drawer:Close"` |
| Menu | `data-component="ViewsTheme:Navigation:Drawer:Menu"` |
| Drill link | `data-action="drill"` |
| Current category link | `data-action="current"` |

Action options (`data-component-options`): `drawerUrl`.

Events: `ViewsTheme:Drawer:Open` / `ViewsTheme:Drawer:Close` (payload: drawer element).

See [JavaScript conventions](../conventions/javascript.md).

## Generic Drawer

`ViewsTheme:Drawer` is reusable (side `start` \| `end`, title/content blocks, Backdrop/Close children). Navigation composes it; other features may reuse the same primitive later.

### Motion

- Root uses `data-side` + `data-open` (`true`/`false`); CSS in `Drawer.css` drives slide/fade
- `open()` shows the layer, reflows, then sets `data-open="true"`
- `close()` sets `data-open="false"`, waits for panel `transitionend` (or duration fallback), then applies `d-none` / `inert` and emits `ViewsTheme:Drawer:Close`
- Token: `--vi-drawer-duration` (default `250ms`)

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/NavigationDrawerController.php` |
| Drawer primitive | `src/Resources/views/components/Drawer.*` |
| Backdrop / Close | `src/Resources/views/components/Drawer/Backdrop.*`, `Close.*` |
| Navigation compose | `src/Resources/views/components/Navigation/Drawer.html.twig` |
| Action | `src/Resources/views/components/Navigation/Drawer/Action.*` |
| Menu (+ drill JS) | `src/Resources/views/components/Navigation/Drawer/Menu.*` |
| Items | `src/Resources/views/components/Navigation/Drawer/{Item,Back,ShowAll,Active,ShowActive}.*` |
| Header wire-up | `src/Resources/views/components/Page/Header/Actions.html.twig` |

## Out of scope (v1)

- Replacing the desktop core navbar
- Migrating cart/cookie offcanvas onto `Drawer`
- Reopening via `?offcanvas=menu` (LanguageSwitch still targets core)
