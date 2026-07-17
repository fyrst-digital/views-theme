# Architecture

ViewsTheme is a Shopware 6.7 platform plugin (`fyrst/views-theme`) that acts as a storefront theme and ships storefront features (variants grid, preferred delivery date).

## Identity

| Property | Value |
|----------|-------|
| Technical name | `ViewsTheme` |
| Composer package | `fyrst/views-theme` |
| PHP namespace | `Fyrst\ViewsTheme` |
| Plugin class | `Fyrst\ViewsTheme\ViewsTheme` |

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
      components/             # Theme UI components (class API)
      storefront/             # Storefront page/layout overrides
    app/storefront/
      src/                    # SCSS, JS plugins, assets (source)
      dist/                   # Built storefront JS
```

## Layers

### PHP / Symfony

- **Controllers** — e.g. `VariantsGridController` for add-to-cart and AJAX pagination.
- **Subscribers** — attach page extensions and persist feature data (product page, checkout confirm, order placed, theme config, cart context).
- **Services** — e.g. `VariantsLoader`, `ThemeParametersResolver`.
- **Twig extensions** — `ViClasses`, `ViIcon`, `ViUtilities`.

### Twig storefront

- **Components** under `views/components/` use the shared [CSS class API](conventions/css-classes.md).
- **Page overrides** under `views/storefront/` extend `@Storefront` templates and include theme components.

### Storefront JS

- Plugins under `app/storefront/src/plugins/` register on `[data-component="…"]` only.
- Entry: `app/storefront/src/main.js`.
- See [JavaScript conventions](conventions/javascript.md).

### SCSS

- Theme styles: `app/storefront/src/scss/` (`override.scss`, `base.scss`, components).
- Loaded via `theme.json` `style` array (overrides before Bootstrap, base after).

## Page extensions

Feature data is attached under `page.extensions.viewsTheme`:

| Key | Subscriber | Purpose |
|-----|------------|---------|
| `variantsGrid` | `ProductPageSubscriber` | Variants grid payload on PDP |
| `deliveryDate` | `CheckoutConfirmPageSubscriber` | Preferred delivery date field config |

## Related

- [Configuration](configuration.md)
- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
