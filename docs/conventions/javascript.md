# JavaScript conventions

## Selectors

**Never use CSS classes as JavaScript selectors.**

| Role | Attribute | Example |
|------|-----------|---------|
| UX component root (co-located JS) | `data-component="ViewsTheme:…"` | `ViewsTheme:VariantsGrid:Container` |
| Internal hooks inside a component | `data-ref="…"` | `grid-body`, `buy-button` |
| Twig → JS options | `data-component-options` | JSON object |

## Co-located component JS

Interactive UX components ship `<Name>.js` next to `<Name>.html.twig`, extending global `ShopwareComponent`. Shopware builds them with Vite and loads them via import map — **no** `PluginManager.register`.

Do **not** use `index.js` / `index.html.twig` naming for components (import-map keys would get a spurious `:index` suffix).

| Component | `data-component` | Script |
|-----------|------------------|--------|
| Header cart | `ViewsTheme:Header:Action:Cart` | `Header/Action/Cart.js` |
| Delivery date | `ViewsTheme:Checkout:DeliveryDateSelection` | `Checkout/DeliveryDateSelection.js` |
| Variants grid | `ViewsTheme:VariantsGrid:Container` | `VariantsGrid/Container.js` |

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
| Grid body | `data-ref="grid-body"` |
| Pagination | `data-ref="pagination"` |
| Quantity input | `data-component="ViewsTheme:QuantityInput"` |
| Buy button | `data-ref="buy-button"` |
| Grid memory | `data-ref="grid-memory"` |
| Live region | `data-ref="live-region"` |
| Error message | `data-ref="error-message"` |

See [Variants grid](../features/variants-grid.md).

### Preferred delivery date

Data: `page.extensions.viewsTheme.deliveryDate`.

| Hook | Attribute |
|------|-----------|
| Wrapper | `data-component="ViewsTheme:Checkout:DeliveryDateSelection"` |

See [Preferred delivery date](../features/delivery-date.md).
