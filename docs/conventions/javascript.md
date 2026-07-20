# JavaScript conventions

## Selectors

**Never use CSS classes as JavaScript selectors.**

| Role | Attribute | Example |
|------|-----------|---------|
| UX component root (co-located JS) | `data-component="ViewsTheme:…"` | `ViewsTheme:VariantsGrid:Container` |
| Twig → JS options | `data-component-options` | JSON object |

Do **not** add new `data-ref` attributes. Shopware mounts co-located JS from `data-component` only. Some existing templates still use `data-ref` for legacy component JS — leave those until migrated; do not extend the pattern.

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

Internal nodes still use legacy `data-ref` in markup for current JS — do not add more.

See [Variants grid](../features/variants-grid.md).

### Preferred delivery date

Data: `page.extensions.viewsTheme.deliveryDate`.

| Hook | Attribute |
|------|-----------|
| Wrapper | `data-component="ViewsTheme:Checkout:DeliveryDateSelection"` |

See [Preferred delivery date](../features/delivery-date.md).

### Search overlay

Lazy-loaded dialog from the header search action.

| Hook | Attribute |
|------|-----------|
| Action | `data-component="ViewsTheme:Search:Action"` |
| Overlay | `data-component="ViewsTheme:Search:Overlay"` |

Backdrop / close still use legacy `data-ref` in markup for current JS — do not add more.

See [Search overlay](../features/search-overlay.md).
