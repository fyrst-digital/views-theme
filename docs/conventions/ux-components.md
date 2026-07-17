# UX Twig components

ViewsTheme storefront UI uses **Shopware UX Twig components** (Symfony UX TwigComponent, Shopware ≥ 6.7.11).

Namespace: **`ViewsTheme`** (plugin bundle name).

```twig
<twig:ViewsTheme:Alert type="info" content="Hello" />
<twig:ViewsTheme:QuantityInput quantity="1" size="sm" />
```

## Directory layout

Anonymous components under `src/Resources/views/components/`:

```text
Alert/index.html.twig                 → ViewsTheme:Alert
QuantityInput/index.html.twig         → ViewsTheme:QuantityInput
Header/Main/index.html.twig           → ViewsTheme:Header:Main
Header/Action/Cart/
  index.html.twig
  index.js                            # co-located ShopwareComponent
VariantsGrid/Container/
  index.html.twig
  index.js
```

- PascalCase directories / names.
- Prefer `index.html.twig` so the directory name is the component name.
- Co-located `index.js` when interactive.

## Props / CVA / attributes

See earlier sections in this guide (props, CVA, nested attributes, blocks).

Always call `attributes.render('class')` **before** rendering `attributes` / `attributes.defaults()`.

## JavaScript

| Role | Attribute | Example |
|------|-----------|---------|
| Interactive UX root | `data-component="ViewsTheme:…"` | `ViewsTheme:VariantsGrid:Container` |
| Internal hooks | `data-ref="…"` | `grid-body`, `buy-button` |
| Options | `data-component-options` | JSON |

Co-located JS extends global `ShopwareComponent`. Build: `composer build:js:storefront`.

## Scope rules

- Migrate and create UI under **`src/Resources/views/components/` only**.
- **Do not create** new files under `src/Resources/views/storefront/`.
- **Only edit** existing storefront templates when replacing an include that already lives there.

## Migration status

| Area | Status |
|------|--------|
| Alert, QuantityInput | UX |
| Header:* (+ Cart JS) | UX |
| Search:*, LanguageSwitch, Offcanvas, Navigation/Flyout | UX / component |
| Product:* | UX + Listing/BuyContainer shells |
| LineItem:*, Cart:*, Wishlist:* | UX / shells |
| Account:*, Address:*, Checkout:*, Order:* | UX / shells |
| Cookie:*, Filter, ContactChannel, MethodOption, GallerySlider, Review:*, Footer:*, Breadcrumb, ScrollUp | UX / shells |
| VariantsGrid:* (+ Container JS) | UX |
| Legacy `vi_define_classes` API | **Removed** |

## Related

- [Component templates](components.md)
- [JavaScript](javascript.md)
- Shopware core README: `vendor/shopware/storefront/Resources/views/components/README.md`
