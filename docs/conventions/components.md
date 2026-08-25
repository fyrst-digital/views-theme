# Component template conventions

## Standard (UX)

All components under `src/Resources/views/components/` use **Shopware UX Twig components** (or thin `sw_extends` shells that compose them).

Full guide: [UX Twig components](ux-components.md).

1. PascalCase path → `<twig:ViewsTheme:…>`
2. Inputs: anonymous → `{% props %}` + simple defaults; heavy view-model → [class component](ux-components.md#class-components-php-backed) (`Name.php` + `#[PostMount]`). No wasteful `resolved*` — [Props](ux-components.md#props)
3. `{% do vi_define_cva(cva) %}` or `{% do vi_define_cva(cva, ['root', …]) %}` (sibling `.cva.twig` + prop merge, or inline map); prop `cva = {}`; BEM `vi-*` roots — [vi-cva.md](../twig/vi-cva.md)
4. `{% do vi_define_attrs(['slot', …]) %}` when using nests. Own root → `attributes.defaults`; DOM/child → `vi_class('slot')` + `vi_attrs('slot').defaults({…})` (**never** `class` in defaults; no `{% set cx/attrs %}`) — [vi-attrs.md](../twig/vi-attrs.md) · [ux-components.md](ux-components.md#attributes)
5. Short `{% block %}` names on own HTML; [`{% vi_block %}`](../twig/vi-block.md) for slots inside a nested `<twig:…>` host
6. Interactive root: `data-component="ViewsTheme:…"` **only** with co-located `<Name>.js` (no `data-ref` / `data-vi`)
7. Co-located `<Name>.js` (`ShopwareComponent`) for every `data-component`

## Extends shells

Some templates still `sw_extends` core Storefront templates (register, address forms, etc.) and live under `components/`. Prefer **pure UX + thin storefront bridge** (Box, BuyContainer, Listing) over keepsake extends shells under `components/`. Extends shells must:

- Not introduce new `views/storefront/` files except documented bridges
- Compose UX children via `<twig:ViewsTheme:…>` or `@ViewsTheme/components/…` includes
- Prefer plain `class="vi-…"` over any removed class-map API

### Deprecated (runtime)

These core `sw_extends` shells emit Twig `{% deprecated %}` on every render (`package="fyrst/views-theme"`, `version="1.0.0"` → `trigger_deprecation`). Rewrite as pure UX (optional thin storefront bridge).

| Tag | Path |
|-----|------|
| `Cookie:Configuration` | `Cookie/Configuration.html.twig` |
| `Cookie:ConfigurationGroup` | `Cookie/ConfigurationGroup.html.twig` |
| `ScrollUp` | `ScrollUp.html.twig` |

Related shims (replacement exists): `Account:Dropdown` → `Account:Menu` inside `Dropdown`; `Page:Header:Action:Account` → `Account:Action`.

## Related

- [UX components](ux-components.md)
- [CSS class API](css-classes.md)
- [JavaScript](javascript.md)
