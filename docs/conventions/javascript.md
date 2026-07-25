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

## Co-located component JS

Interactive UX components ship `<Name>.js` next to `<Name>.html.twig`, extending global `ShopwareComponent`. Shopware builds them with Vite and loads them via import map — **no** `PluginManager.register`.

Do **not** use `index.js` / `index.html.twig` naming for components (import-map keys would get a spurious `:index` suffix).

| Component | `data-component` | Script |
|-----------|------------------|--------|
| Header cart | `ViewsTheme:Page:Header:Action:Cart` | `Page/Header/Action/Cart.js` |
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

Search: Backdrop/Close call `Shopware.callMethod('ViewsTheme:Search:Overlay', 'close')`. Overlay emits `ViewsTheme:Search:Overlay:Open` / `:Close` via `emitQueued` (payload: overlay element).  
Closed overlay sets `inert` (plus `aria-hidden`) so tab order skips it; while open, Tab is trapped inside the dialog.  
Suggest HTML is inserted as the form’s next sibling. Product grid scrolls via nested `Scroll:Area`.

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
| Drill link | `data-component="ViewsTheme:Navigation:Drawer:Drill"` |

- Drill `emit`s `ViewsTheme:Navigation:Drawer:Menu:Drill` `{ url, source, direction }`; Menu `on`s and filters with `contains(source)` (Item uses Drill on the caret only; label is a plain category link)
- Panel `callMethod`s `Drawer.onPanelTransitionEnd` on transform `transitionend`
- Backdrop/Close `callMethod` `Drawer.close`
- Menu: one `_busy` flight (fetch + apply); dual `[data-level]` CSS transform slide (no height JS); duration from `--vi-navigation-drawer-menu-duration`; reduced motion swaps immediately

See [Navigation drawer](../features/navigation-drawer.md).

### Scroll area

Reusable scrollport with top/bottom mask fades (co-located `Scroll/Area.css`, `--scroll-fade`).

| Hook | Attribute |
|------|-----------|
| Root | `data-component="ViewsTheme:Scroll:Area"` |

JS toggles `data-scroll-up` / `data-scroll-down`. Put content in the component’s `content` block.

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
