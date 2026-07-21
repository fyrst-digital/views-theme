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

Do **not** use `data-ref`. Prefer `data-action` or semantic selectors. Legacy components may still have `data-ref` — leave until migrated; do not extend the pattern.

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
| Scroll area (edge fades) | `ViewsTheme:Scroll:Area` | `Scroll/Area.js` |

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

Internal nodes may still use legacy `data-ref` — do not add more.

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

Backdrop/Close dispatch bubbled `ViewsTheme:Search:Overlay:dismiss`; Overlay listens and closes.  
Suggest HTML is inserted as the form’s next sibling. Product grid scrolls via nested `Scroll:Area`.

See [Search overlay](../features/search-overlay.md).

### Scroll area

Reusable scrollport with top/bottom mask fades (co-located `Scroll/Area.css`, `--scroll-fade`).

| Hook | Attribute |
|------|-----------|
| Root | `data-component="ViewsTheme:Scroll:Area"` |

JS toggles `data-scroll-up` / `data-scroll-down`. Put content in the component’s `content` block.
