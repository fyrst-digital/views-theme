# JavaScript conventions

## Selectors

**Never use CSS classes as JavaScript selectors.**

| Role | Attribute | Example |
|------|-----------|---------|
| UX component root (co-located JS) | `data-component="ViewsTheme:…"` | `ViewsTheme:VariantsGrid:Container` |
| Internal hooks inside a component | `data-ref="…"` | `grid-body`, `buy-button` |
| Twig → JS options | `data-component-options` | JSON object |

Legacy plugins may still select old kebab `data-component` values until that domain migrates.

## Co-located component JS (target)

Interactive UX components ship `index.js` next to `index.html.twig`, extending global `ShopwareComponent`. Shopware builds them with Vite and loads them via import map — **no** `PluginManager.register`.

```js
// views/components/Header/Action/Cart/index.js
export default class HeaderActionCart extends ShopwareComponent {
  static options = {
    badgeClass: 'badge bg-primary',
  }

  init() {
    // …
  }

  destroy() {
    // …
  }
}
```

```twig
<button
  data-component="ViewsTheme:Header:Action:Cart"
  data-component-options="{{ jsOptions|json_encode }}"
>
```

Internal refs:

```js
static options = {
  gridBodySelector: '[data-ref="grid-body"]',
}
```

Build (project root):

```bash
composer build:js:storefront
# or component-focused rebuild + assets:install + theme:compile
```

Dev: `composer storefront:dev-server`.

## Legacy PluginManager plugins

Still registered from `app/storefront/src/main.js` until their domain migrates:

| Plugin | Selector (current) | Target UX root |
|--------|--------------------|----------------|
| `VariantsGrid` | `[data-component="variants-grid"]` | `ViewsTheme:VariantsGrid:Container` |
| `DeliveryDateSelection` | `[data-component="delivery-date-selection"]` | `ViewsTheme:Checkout:DeliveryDateSelection` |

### Migrated co-located components

| Component | `data-component` | Script |
|-----------|------------------|--------|
| Header cart | `ViewsTheme:Header:Action:Cart` | `Header/Action/Cart/index.js` |

`QuantityInput` root is `data-component="ViewsTheme:QuantityInput"` (no co-located JS yet; core `data-quantity-selector` remains).

## Features

### Variants grid

Data: `page.extensions.viewsTheme.variantsGrid`. Plugin: `VariantsGridPlugin` (until PR migrates to co-located JS).

| Hook | Attribute (current) |
|------|---------------------|
| Grid container | `data-component="variants-grid"` |
| Grid body | `data-component="grid-body"` → will become `data-ref` |
| Pagination | `data-component="pagination"` |
| Quantity input | `data-component="ViewsTheme:QuantityInput"` |
| Buy button | `data-component="buy-button"` |
| Grid memory | `data-component="grid-memory"` |
| Live region | `data-component="live-region"` |
| Error message | `data-component="error-message"` |

See [Variants grid](../features/variants-grid.md).

### Preferred delivery date

Data: `page.extensions.viewsTheme.deliveryDate`. Plugin: `DeliveryDatePlugin`.

| Hook | Attribute |
|------|-----------|
| Wrapper | `data-component="delivery-date-selection"` |

See [Preferred delivery date](../features/delivery-date.md).
