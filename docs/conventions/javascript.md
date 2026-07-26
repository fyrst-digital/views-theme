# JavaScript conventions

## Selectors & structure

**Never use CSS classes as JavaScript selectors.**

| Role | Mechanism | Example |
|------|-----------|---------|
| Component root | `data-component="ViewsTheme:…"` | `ViewsTheme:Drawer` |
| Options | `data-component-options` | JSON object |
| Structure that needs behavior | **Nested UX component** + co-located JS | `ViewsTheme:Drawer:Panel` |
| Child → parent command | `Shopware.callMethod(name, method, …)` | Backdrop → `Drawer.close` |
| Lifecycle / multi-listener | `emit` / `emitQueued` + `on` / `off` | `ViewsTheme:Drawer:Open` |
| Unambiguous native controls | Semantic selectors | `input[type="search"]`, `button[type="submit"]` |

Find nested components with `[data-component="ViewsTheme:…"]` (component identity), not ad-hoc hooks.

**Deprecated for new code:** `data-action="…"` as JS hooks. Prefer a real sub-component. Legacy uses remain on Variants grid / Search until migrated.

Do **not** use `data-ref` (removed).

Prefer **event delegation** only when a single parent owns many identical children *and* those children are not worth components — default is still sub-components for interactive pieces.

## Component communication

| Pattern | Use for |
|---------|---------|
| `Shopware.emit` / `emitQueued` + `Shopware.on` / `off` | Cross-component lifecycle and multi-listener flows (payload may include `source` for `contains` checks) |
| `Shopware.callMethod(name, method, …)` | Direct child → parent API (e.g. Close → `close`, Panel → `onPanelTransitionEnd`) |
| Native `CustomEvent` on `document` | External/analytics hooks only |

Do **not** use bubbled DOM CustomEvents for component-to-component wiring. Prefer `emitQueued` when emitting from `init()` to avoid race conditions. Always `Shopware.off` in `destroy()`.

**Event name casing:** PascalCase segments (`Namespace:Feature:Action`), e.g. `ViewsTheme:Drawer:Open`, `ViewsTheme:Navigation:Drawer:Menu:Drill`.

## Lazy-loaded shells (critical)

Applies to **lazy-mounted shells** fetched by an Action:

- `ViewsTheme:Drawer` (e.g. Navigation drawer)
- `ViewsTheme:Search:Overlay`

Does **not** cover in-session Menu drill level HTML caches, suggest result fragments, or **Navigation flyout** panel HTML (see exception below).

| Phase | Required |
|-------|----------|
| **Open** | Always **(re)fetch** HTML. Never keep a string cache of a previous response for reuse. |
| **Close** | After close completes (`*:Close` event), **remove** the shell root from the DOM. Do not keep a closed mount for the next open. |
| **Re-open** | Full fetch + mount again. |

The Action owns this lifecycle; the shell primitive only open/closes.

**Search overlay only:** Action keeps the **term string** from the Close payload (`{ el, term }`). On open it calls `overlay.open({ term })` only. Overlay coordinates Bar (`onOpened` / `getTerm` / `focusInput`) and `emitQueued` Open/Close `{ el, term }`. Action never queries the input DOM. Never cache overlay HTML or suggest DOM for reuse.

### Exception: Navigation flyout HTML cache

`ViewsTheme:Navigation:Bar` may keep an **in-session memory cache** of flyout HTML strings keyed by category id (hover thrash). Rules:

| Rule | Required |
|------|----------|
| Storage | Memory on the Bar instance only — **no** `sessionStorage` / `localStorage` |
| DOM | Still **unmount** the closed flyout root; reopen = cache hit → remount (or fetch on miss) |
| Races | Abort in-flight fetch; ignore stale responses when the open target changes |
| Lifetime | Cleared on hard reload (new page = new Bar instance) |

See [Navigation bar](../features/navigation-bar.md).

References: `Navigation/Drawer/Action.js`, `Navigation/Bar.js`, `Navigation/Flyout.js`, `Search/Action.js`, `Search/Overlay.js`, `Search/Bar.js`.

## Co-located component JS

Interactive UX components ship `<Name>.js` next to `<Name>.html.twig`, extending global `ShopwareComponent`. Shopware builds them with Vite and loads them via import map — **no** `PluginManager.register`.

Do **not** use `index.js` / `index.html.twig` naming for components (import-map keys would get a spurious `:index` suffix).

| Component | `data-component` | Script |
|-----------|------------------|--------|
| Header cart | `ViewsTheme:Page:Header:Action:Cart` | `Page/Header/Action/Cart.js` |
| Navigation bar | `ViewsTheme:Navigation:Bar` | `Navigation/Bar.js` |
| Navigation flyout | `ViewsTheme:Navigation:Flyout` | `Navigation/Flyout.js` |
| Delivery date | `ViewsTheme:Checkout:DeliveryDateSelection` | `Checkout/DeliveryDateSelection.js` |
| Variants grid | `ViewsTheme:VariantsGrid:Container` | `VariantsGrid/Container.js` |
| Search action | `ViewsTheme:Search:Action` | `Search/Action.js` |
| Search overlay | `ViewsTheme:Search:Overlay` | `Search/Overlay.js` |
| Search overlay backdrop | `ViewsTheme:Search:Overlay:Backdrop` | `Search/Overlay/Backdrop.js` |
| Search overlay close | `ViewsTheme:Search:Overlay:Close` | `Search/Overlay/Close.js` |
| Search bar | `ViewsTheme:Search:Bar` | `Search/Bar.js` |
| Drawer | `ViewsTheme:Drawer` | `Drawer.js` |
| Drawer panel | `ViewsTheme:Drawer:Panel` | `Drawer/Panel.js` |
| Drawer backdrop | `ViewsTheme:Drawer:Backdrop` | `Drawer/Backdrop.js` |
| Drawer close | `ViewsTheme:Drawer:Close` | `Drawer/Close.js` |
| Navigation drawer action | `ViewsTheme:Navigation:Drawer:Action` | `Navigation/Drawer/Action.js` |
| Navigation drawer menu | `ViewsTheme:Navigation:Drawer:Menu` | `Navigation/Drawer/Menu.js` |
| Navigation drawer drill | `ViewsTheme:Navigation:Drawer:Drill` | `Navigation/Drawer/Drill.js` |
| Language flag (load error / fallback) | `ViewsTheme:Language:Flag` | `Language/Flag.js` |
| Scroll area (edge fades) | `ViewsTheme:Scroll:Area` | `Scroll/Area.js` |
| Dropdown (a11y focus / aria-expanded) | `ViewsTheme:Dropdown` | `Dropdown.js` |

Build (project root):

```bash
composer build:js:storefront
```

Dev: `composer storefront:dev-server`.

## Features

### Variants grid

Data: `page.extensions.viewsTheme.variantsGrid`.

| Hook | Attribute |
|------|-----------|
| Grid container | `data-component="ViewsTheme:VariantsGrid:Container"` |
| Quantity input | `data-component="ViewsTheme:QuantityInput"` |
| Pagination slot | `data-action="pagination"` (legacy) |
| Quantity memory | `data-action="memory"` (legacy) |
| Buy submit | `button[type="submit"]` |
| Error | `[role="alert"]` |
| Live region | `[aria-live]` |

See [Variants grid](../features/variants-grid.md).

### Preferred delivery date

Data: `page.extensions.viewsTheme.deliveryDate`.

| Hook | Attribute |
|------|-----------|
| Wrapper | `data-component="ViewsTheme:Checkout:DeliveryDateSelection"` |

See [Preferred delivery date](../features/delivery-date.md).

### Search overlay

Lazy-loaded dialog from the header search action. Suggest UX lives on the bar component (not core `SearchWidgetPlugin`).

| Hook | Attribute |
|------|-----------|
| Action | `data-component="ViewsTheme:Search:Action"` |
| Overlay | `data-component="ViewsTheme:Search:Overlay"` |
| Backdrop | `data-component="ViewsTheme:Search:Overlay:Backdrop"` |
| Close | `data-component="ViewsTheme:Search:Overlay:Close"` |
| Bar | `data-component="ViewsTheme:Search:Bar"` |
| View all results | `data-action="view-all"` (legacy) |

- Action lifecycle (critical): **(re)fetch + mount on every open**; `overlay.open({ term })`; on Close **unmount** — see [Lazy-loaded shells](#lazy-loaded-shells-critical)
- Open/Close payload: `{ el, term }` via `emitQueued` (Action stores `term` / aria); Overlay calls `Bar.onOpened(term)` once for restore + suggest
- Backdrop/Close `callMethod('ViewsTheme:Search:Overlay', 'close')`
- While open, Tab is trapped inside the dialog; closed mount is not kept (unmounted)
- Suggest HTML is inserted as the form’s next sibling; product grid scrolls via nested `Scroll:Area`

See [Search overlay](../features/search-overlay.md).

### Navigation drawer

Lazy-loaded side drawer. **Menu** owns drill-down orchestration; interactive links are sub-components.

| Hook | Attribute |
|------|-----------|
| Action | `data-component="ViewsTheme:Navigation:Drawer:Action"` |
| Drawer (mount root) | `data-component="ViewsTheme:Drawer"` / `#vi-navigation-drawer` |
| Panel | `data-component="ViewsTheme:Drawer:Panel"` |
| Backdrop | `data-component="ViewsTheme:Drawer:Backdrop"` |
| Close | `data-component="ViewsTheme:Drawer:Close"` |
| Menu | `data-component="ViewsTheme:Navigation:Drawer:Menu"` |
| Menu scrollport | nested `data-component="ViewsTheme:Scroll:Area"` |
| Drill link | `data-component="ViewsTheme:Navigation:Drawer:Drill"` |

- Action lifecycle (critical): **(re)fetch + mount on every open**; on `ViewsTheme:Drawer:Close` **unmount** drawer root (no HTML/DOM cache) — see [Lazy-loaded shells](#lazy-loaded-shells-critical)
- Drill `emit`s `ViewsTheme:Navigation:Drawer:Menu:Drill` `{ url, source, direction }`; Menu `on`s and filters with `contains(source)` (Item uses Drill on the caret only; label is a plain category link)
- Panel `callMethod`s `Drawer.onPanelTransitionEnd` on transform `transitionend`
- Drawer close timeout reads CSS var from options `durationVar` (default `--vi-drawer-duration`) / `durationFallback`
- Backdrop/Close `callMethod` `Drawer.close`
- Menu: one `_busy` flight (fetch + apply); dual `[data-level]` slide in nested `Scroll:Area` (absolute `inset: 0` stage; two-phase `from`/`enter` → `data-animating` → `out`/`in`); scroll resets after swap; duration from `--vi-navigation-drawer-menu-duration`; reduced motion swaps immediately

See [Navigation drawer](../features/navigation-drawer.md).

### Navigation bar / flyout

Desktop top-level bar with lazy mega flyouts. **Bar** owns intent, fetch, cache, and mount; **Flyout** owns panel open/close motion and lifecycle events.

| Hook | Attribute |
|------|-----------|
| Bar | `data-component="ViewsTheme:Navigation:Bar"` |
| Flyout host | `data-flyout-host` (under Bar) |
| Item trigger | `data-flyout-trigger` + `data-flyout-url` + `data-navigation-id` |
| Flyout | `data-component="ViewsTheme:Navigation:Flyout"` |

| Event | Emitter | Listener |
|-------|---------|----------|
| `ViewsTheme:Navigation:Flyout:Open` | Flyout (`emitQueued`, `{ el }`) | Bar (sync trigger ARIA; filter `contains(el)`) |
| `ViewsTheme:Navigation:Flyout:Close` | Flyout (`emitQueued`, `{ el }`) | Bar **unmounts** flyout DOM + clears ARIA (string cache kept) |

- Open: debounced hover/focus on trigger → fetch or memory cache → mount into host → `flyout.open()`
- Close: leave delay, Escape, focus out → `flyout.close()` → Close event → Bar unmounts
- Only one flyout; `AbortController` + request id ignore stale responses
- Empty / failed fetch resets trigger ARIA (no stuck `aria-expanded`)
- Active path: `window.activeNavigationId` / `window.activeNavigationPathIdList` → `data-active` on triggers
- Cache exception: see [Lazy-loaded shells](#lazy-loaded-shells-critical)

See [Navigation bar](../features/navigation-bar.md).

### Scroll area

Reusable scrollport with top/bottom mask fades (co-located `Scroll/Area.css`, `--scroll-fade`). Base CVA: `vi-scroll-area overflow-y-auto` — callers add axis extras (e.g. `overflow-x-clip`) via `class`.

| Hook | Attribute |
|------|-----------|
| Root | `data-component="ViewsTheme:Scroll:Area"` |

JS toggles `data-scroll-up` / `data-scroll-down`. Put content in the component’s `content` block. Used by Search results and Navigation drawer menu.

### Dropdown

Generic disclosure panel: HTML Popover API + CSS `position-anchor` / `anchor()` (placement is CSS-only: `bottom-start` \| `bottom-center` \| `bottom-end` \| `top-start` \| `top-end`). Host wrapper (`vi-dropdown-host`, `display: contents`) holds toggle + panel. Co-located `Dropdown.css` + a11y-only `Dropdown.js`.

| Hook | Attribute |
|------|-----------|
| Host | `data-component="ViewsTheme:Dropdown"` |
| Panel | `[popover].vi-dropdown` |
| Toggle | `[popovertarget]` / `vi-dropdown__toggle` |

JS runs on the host, resolves panel + toggle inside, and syncs `aria-expanded` on the toggle event. Open/close, light-dismiss, focus, and placement stay native/CSS. Root `class` / CVA apply to the **panel**; `host:class` / `host` CVA on the host; `toggle:*` on the button. Use `host:class="vi-dropdown-host--lg-up"` to hide the whole control below `lg` without popover anchor jump.

Build storefront assets from Shopware root: `make build-storefront`.

See [Account action](../features/account-action.md).
