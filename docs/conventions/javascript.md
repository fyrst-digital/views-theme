# JavaScript conventions

## Selectors

**Never use CSS classes as JavaScript selectors.**

| Role | Attribute | Example |
|------|-----------|---------|
| UX component root (co-located JS) | `data-component="ViewsTheme:…"` | `ViewsTheme:VariantsGrid:Container` |
| Twig → JS options | `data-component-options` | JSON object |
| Internal interactive hooks | `data-action="…"` | `view-all` |

Prefer **event delegation** on the component root for `data-action` clicks.

Semantic element selectors are fine when unambiguous (`input[type="search"]`, `button[type="submit"]`).

Do **not** use `data-ref` (removed). Prefer `data-action` or semantic selectors.

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
| Drawer backdrop | `ViewsTheme:Drawer:Backdrop` | `Drawer/Backdrop.js` |
| Drawer close | `ViewsTheme:Drawer:Close` | `Drawer/Close.js` |
| Navigation drawer action | `ViewsTheme:Navigation:Drawer:Action` | `Navigation/Drawer/Action.js` |
| Navigation drawer menu | `ViewsTheme:Navigation:Drawer:Menu` | `Navigation/Drawer/Menu.js` |
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
| Pagination slot | `data-action="pagination"` |
| Quantity memory | `data-action="memory"` |
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
| View all results | `data-action="view-all"` |

**Component communication (preferred):**

| Pattern | Use for |
|---------|---------|
| `Shopware.emit` / `emitQueued` + `Shopware.on` / `off` | Cross-component lifecycle (e.g. Overlay open/close → Action, Bar) |
| `Shopware.callMethod(name, method, …)` | Direct child → parent actions (e.g. Backdrop/Close → Overlay `close`) |
| Native `CustomEvent` on `document` | External/analytics hooks only (e.g. `product:search-performed`) |

Do **not** use bubbled DOM CustomEvents for component-to-component wiring. Prefer `emitQueued` when emitting from `init()` to avoid race conditions. Always `Shopware.off` in `destroy()`.

**Event name casing:** Shopware bus events use **PascalCase** segments (`Namespace:Feature:Action`), e.g. `ViewsTheme:Search:Overlay:Open` — not `:open`.

Search: Backdrop/Close call `Shopware.callMethod('ViewsTheme:Search:Overlay', 'close')`. Overlay emits `ViewsTheme:Search:Overlay:Open` / `:Close` via `emitQueued` (payload: overlay element).  
Closed overlay sets `inert` (plus `aria-hidden`) so tab order skips it; while open, Tab is trapped inside the dialog.  
Suggest HTML is inserted as the form’s next sibling. Product grid scrolls via nested `Scroll:Area`.

See [Search overlay](../features/search-overlay.md).

### Navigation drawer

Lazy-loaded side drawer from the header menu action. **Menu** owns drill-down; the nav shell is Twig composition only.

| Hook | Attribute |
|------|-----------|
| Action | `data-component="ViewsTheme:Navigation:Drawer:Action"` |
| Shell | `#vi-navigation-drawer-shell` |
| Drawer | `data-component="ViewsTheme:Drawer"` |
| Backdrop | `data-component="ViewsTheme:Drawer:Backdrop"` |
| Close | `data-component="ViewsTheme:Drawer:Close"` |
| Menu | `data-component="ViewsTheme:Navigation:Drawer:Menu"` |
| Drill link | `data-action="drill"` |

Menu parses fetched HTML with `<template>`, keeps its root instance, and applies the level with `replaceChildren` (no live `innerHTML` assign). Drawer emits `ViewsTheme:Drawer:Open` / `:Close` via `emitQueued`. Backdrop/Close call `Shopware.callMethod('ViewsTheme:Drawer', 'close')`.

Prefer `replaceWith` / `replaceChildren` over assigning `innerHTML` on live nodes when applying HTML fragments.

See [Navigation drawer](../features/navigation-drawer.md).

### Scroll area

Reusable scrollport with top/bottom mask fades (co-located `Scroll/Area.css`, `--scroll-fade`).

| Hook | Attribute |
|------|-----------|
| Root | `data-component="ViewsTheme:Scroll:Area"` |

JS toggles `data-scroll-up` / `data-scroll-down`. Put content in the component’s `content` block.

### Dropdown

Generic disclosure panel: HTML Popover API + CSS `position-anchor` / `anchor()` (placement is CSS-only). Flat markup (toggle button + panel host, no wrapper). Co-located `Dropdown.css` + a11y-only `Dropdown.js`.

| Hook | Attribute |
|------|-----------|
| Panel (host) | `data-component="ViewsTheme:Dropdown"` |

JS runs on the panel, resolves the toggle via `[popovertarget="{id}"]`, and syncs `aria-expanded` on the toggle event. Open/close, light-dismiss, focus, and placement stay native/CSS. Root attrs/CVA apply to the panel (`vi-dropdown`); toggle uses nested `toggle:*` / `vi-dropdown__toggle`.

Build storefront assets from Shopware root: `make build-storefront`.

See [Account action](../features/account-action.md).
