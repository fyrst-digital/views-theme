# Component template conventions

## Standard (UX)

All components under `src/Resources/views/components/` use **Shopware UX Twig components** (or thin `sw_extends` shells that compose them).

Full guide: [UX Twig components](ux-components.md).

1. PascalCase path → `<twig:ViewsTheme:…>`
2. `{% props %}` for inputs (pure UX components)
3. `vi_cva({ … }|replace_recursive(cva))` + nested attrs (BEM `vi-*` roots); prop `cva = {}`
4. Short `{% block %}` names
5. Interactive root: `data-component="ViewsTheme:…"`; internal hooks: `data-ref="…"`
6. Co-located `<Name>.js` (`ShopwareComponent`) when interactive

## Extends shells

Some templates still `sw_extends` core Storefront templates (listing, buy-widget, register, address forms, etc.) and live under `components/`. They must:

- Not introduce new `views/storefront/` files
- Compose UX children via `<twig:ViewsTheme:…>` or `@ViewsTheme/components/…` includes
- Prefer plain `class="vi-…"` over any removed class-map API

## Related

- [UX components](ux-components.md)
- [CSS class API](css-classes.md)
- [JavaScript](javascript.md)
