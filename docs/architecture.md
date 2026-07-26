# Architecture

ViewsTheme is a Shopware 6.7 platform plugin (`fyrst/views-theme`) that acts as a storefront theme and ships storefront features (variants grid, preferred delivery date, search overlay, navigation drawer).

## Identity

| Property | Value |
|----------|-------|
| Technical name | `ViewsTheme` |
| Composer package | `fyrst/views-theme` |
| PHP namespace | `Fyrst\ViewsTheme` |
| Plugin class | `Fyrst\ViewsTheme\ViewsTheme` |
| UX component namespace | `ViewsTheme` |

## Directory layout

```
src/
  ViewsTheme.php
  Controller/
  Service/
  Struct/
  Subscriber/
  Twig/                       # vi_icon, vi_merge_deep
  Resources/
    config/
    theme.json
    views/
      components/             # UX Twig components (primary UI)
      storefront/             # Existing page/layout overrides only
    app/storefront/
      src/                    # Theme SCSS + legacy bundle entry
      dist/
```

## Layers

### Twig

- **UX components** under `views/components/` as `<twig:ViewsTheme:…>` ([UX guide](conventions/ux-components.md)).
- **Page overrides** only in existing `views/storefront/` files.

### Storefront JS

- Co-located `<Name>.js` next to interactive UX components (`ShopwareComponent` + import map).
- Theme entry `app/storefront/src/main.js` is minimal (no PluginManager plugins remaining).

### SCSS

- Theme styles: `app/storefront/src/scss/` via `theme.json`.

## Page extensions

| Key | Subscriber | Purpose |
|-----|------------|---------|
| `variantsGrid` | `ProductPageSubscriber` | Variants grid payload on PDP |
| `deliveryDate` | `CheckoutConfirmPageSubscriber` | Preferred delivery date field config |

## Storefront routes

ViewsTheme storefront controllers use a dedicated URL path prefix:

| Rule | Detail |
|------|--------|
| Path prefix | **`/vi/…`** |
| Route names | Prefer `frontend.views-theme.*` (feature-specific names OK when already established) |
| Generation | Always `path('route.name')` in Twig — never hardcode paths in JS |
| Avoid | New `/widgets/…` paths (core-style; collision-prone) |

Examples:

| Name | Path |
|------|------|
| `frontend.views-theme.search.overlay` | `/vi/search/overlay` |
| `frontend.views-theme.search.suggest` | `/vi/search/suggest` |
| `frontend.views-theme.navigation.drawer` | `/vi/navigation/drawer` |
| `frontend.views-theme.navigation.drawer.menu` | `/vi/navigation/drawer/menu` |
| `frontend.views-theme.navigation.flyout` | `/vi/navigation/flyout/{navigationId}` |

Legacy feature routes (e.g. variants grid under `/checkout/variants-grid/…`) may predate this convention; new routes must use `/vi/…`.

## Related

- [Configuration](configuration.md)
- [UX components](conventions/ux-components.md)
- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
- [Search overlay](features/search-overlay.md)
- [Navigation drawer](features/navigation-drawer.md)
- [Navigation bar](features/navigation-bar.md)
