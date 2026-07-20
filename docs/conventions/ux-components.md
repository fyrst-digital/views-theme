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
Alert.html.twig                       → ViewsTheme:Alert
Alert.cva.twig                        # optional co-located CVA defaults
QuantityInput.html.twig               → ViewsTheme:QuantityInput
Page/Header.html.twig                 → ViewsTheme:Page:Header
Page/Header/Main.html.twig            → ViewsTheme:Page:Header:Main
Page/Header/Action/Cart.html.twig
Page/Header/Action/Cart.js            # co-located ShopwareComponent
Page/Footer/Bottom.html.twig          → ViewsTheme:Page:Footer:Bottom
VariantsGrid/Container.html.twig
VariantsGrid/Container.js
```

- PascalCase directories / leaf file names.
- Prefer **named files** (`Cart.html.twig` + `Cart.js`), not `index.*` (avoids import-map `:index` suffix).
- Co-located JS/SCSS/CVA share the leaf name when needed (`Name.cva.twig` for `vi_cva_from_file`).
- **`Page`** = global storefront layout chrome (header, footer, …).

## Props / CVA / attributes

Multi-slot class API:

1. Default map: sibling **`Name.cva.twig`** (preferred for larger maps) or inline hash
2. Compose: `{% set cx = vi_cva_from_file(cva) %}` or `vi_cva({ … }|replace_recursive(cva))`
3. Caller override: `:cva="{ … }"` deep-merged into defaults
4. Render: `class="{{ cx.root.apply({ size: size }) }}"` / `cx.label.apply(…)`
5. Extras: `class="…"` (root) and `label:class="…"` (nested)

Always call `vi_cva` / `vi_cva_from_file` **before** rendering `attributes` / `attributes.defaults()`.

Co-locate like JS: `Alert.html.twig` + `Alert.cva.twig` (+ `Alert.js` when interactive).

See [vi_cva](../twig/vi-cva.md) and [CSS class API](css-classes.md).

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
| Alert, QuantityInput | UX + `vi_cva` |
| Page:Header:* (+ Cart JS), Page:Footer:* | UX + `vi_cva` |
| Search:* (+ Action/Overlay JS), LanguageSwitch, Offcanvas, Navigation/Flyout | UX / component |
| Product:* | UX + Listing/BuyContainer shells |
| LineItem:*, Cart:*, Wishlist:* | UX / shells |
| Account:*, Address:*, Checkout:*, Order:* | UX / shells |
| Cookie:*, Filter, ContactChannel, MethodOption, GallerySlider, Review:*, Breadcrumb, ScrollUp | UX / shells |
| VariantsGrid:* (+ Container JS) | UX + `vi_cva` |
| Legacy `vi_define_classes` / `defaultBaseClasses` API | **Removed** |

## Related

- [Component templates](components.md)
- [JavaScript](javascript.md)
- [`vi_cva`](../twig/vi-cva.md)
- Shopware core README: `vendor/shopware/storefront/Resources/views/components/README.md`
