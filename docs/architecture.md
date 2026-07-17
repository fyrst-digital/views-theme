# Architecture

ViewsTheme is a Shopware 6.7 platform plugin (`fyrst/views-theme`) that acts as a storefront theme and ships storefront features (variants grid, preferred delivery date).

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
  ViewsTheme.php              # Plugin bootstrap
  Controller/                 # Storefront controllers (attribute routes)
  Service/                    # Domain services
  Struct/                     # Transfer objects
  Subscriber/                 # Event subscribers
  Twig/                       # Twig extensions (vi_*)
  Resources/
    config/                   # services.xml, routes.xml, config.xml
    theme.json                # Theme definition and admin fields
    views/
      components/             # UX components (migrating) + legacy includes
      storefront/             # Storefront page/layout overrides
    app/storefront/
      src/                    # Theme SCSS, legacy JS plugins, assets
      dist/                   # Built storefront JS
```

## Layers

### PHP / Symfony

- **Controllers** — e.g. `VariantsGridController` for add-to-cart and AJAX pagination.
- **Subscribers** — attach page extensions and persist feature data (product page, checkout confirm, order placed, theme config, cart context).
- **Services** — e.g. `VariantsLoader`, `ThemeParametersResolver`.
- **Twig extensions** — `ViClasses` (legacy class maps), `ViIcon`, `ViUtilities`.

### Twig storefront

- **UX components** under `views/components/` as `<twig:ViewsTheme:…>` ([UX guide](conventions/ux-components.md)).
- **Legacy components** still use `sw_include` + `vi_define_classes` until their domain migrates.
- **Page overrides** under `views/storefront/` extend `@Storefront` and compose theme components.

### Storefront JS

- **Target:** co-located `index.js` next to UX components (`ShopwareComponent` + import map).
- **Legacy:** plugins under `app/storefront/src/plugins/` registered from `main.js` on `[data-component="…"]`.
- See [JavaScript conventions](conventions/javascript.md).

### SCSS

- Theme styles: `app/storefront/src/scss/` (`override.scss`, `base.scss`, components).
- Loaded via `theme.json` `style` array.
- Component-local CSS is optional later; v1 keeps theme SCSS and `vi-*` hooks.

## Page extensions

Feature data is attached under `page.extensions.viewsTheme`:

| Key | Subscriber | Purpose |
|-----|------------|---------|
| `variantsGrid` | `ProductPageSubscriber` | Variants grid payload on PDP |
| `deliveryDate` | `CheckoutConfirmPageSubscriber` | Preferred delivery date field config |

## Related

- [Configuration](configuration.md)
- [UX components](conventions/ux-components.md)
- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
