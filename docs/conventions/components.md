# Component template conventions

## Standard (UX)

All components under `src/Resources/views/components/` use **Shopware UX Twig components** (or thin `sw_extends` shells that compose them).

Full guide: [UX Twig components](ux-components.md).

1. PascalCase path → `<twig:ViewsTheme:…>`
2. Inputs: anonymous → `{% props %}` + simple defaults; heavy view-model → [class component](ux-components.md#class-components-php-backed) (`Name.php` + `#[PostMount]`). No wasteful `resolved*` — [Props](ux-components.md#props)
3. `vi_cva_from_file(cva)` (sibling `Name.cva.twig`) or inline `vi_cva({ … }|replace_recursive(cva))`; prop `cva = {}`; BEM `vi-*` roots
4. Attrs: after `vi_cva*`, pre-bind nests into **`attrs`** (`slot: attributes.nested('slot')`); own root → `attributes.defaults`; DOM nest → `attrs.slot` / `attrs.slot.defaults`; overridable child → `class="{{ classes.slot }}"` + `{{ ...attrs.slot.defaults({…}).all() }}` (**never** `class` in defaults; quoted nested keys e.g. `'button:label': false`; no bare `attributes.nested` / `parentAttributes`) — [ux-components.md § Attributes](ux-components.md#attributes)
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
