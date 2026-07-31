# Component template conventions

## Standard (UX)

All components under `src/Resources/views/components/` use **Shopware UX Twig components** (or thin `sw_extends` shells that compose them).

Full guide: [UX Twig components](ux-components.md).

1. PascalCase path → `<twig:ViewsTheme:…>`
2. Inputs: anonymous → `{% props %}` + simple defaults; heavy view-model → [class component](ux-components.md#class-components-php-backed) (`Name.php` + `#[PostMount]`). No wasteful `resolved*` — [Props](ux-components.md#props)
3. `{% do vi_define_cva(cva) %}` or `{% do vi_define_cva(cva, ['root', …]) %}` (sibling `.cva.twig` + prop merge, or inline map); prop `cva = {}`; BEM `vi-*` roots — [vi-cva.md](../twig/vi-cva.md)
4. `{% do vi_define_attrs(['slot', …]) %}` when using nests. Own root → `attributes.defaults`; DOM/child → `vi_class('slot')` + `vi_attrs('slot').defaults({…})` (**never** `class` in defaults; no `{% set cx/attrs %}`) — [vi-attrs.md](../twig/vi-attrs.md) · [ux-components.md](ux-components.md#attributes)
5. Short `{% block %}` names
6. Interactive root: `data-component="ViewsTheme:…"` **only** with co-located `<Name>.js` (no `data-ref` / `data-vi`)
7. Co-located `<Name>.js` (`ShopwareComponent`) for every `data-component`

## Extends shells

Some templates still `sw_extends` core Storefront templates (listing, buy-widget, register, address forms, etc.) and live under `components/`. They must:

- Not introduce new `views/storefront/` files
- Compose UX children via `<twig:ViewsTheme:…>` or `@ViewsTheme/components/…` includes
- Prefer plain `class="vi-…"` over any removed class-map API

## Related

- [UX components](ux-components.md)
- [CSS class API](css-classes.md)
- [JavaScript](javascript.md)
