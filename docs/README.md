# ViewsTheme documentation

Developer documentation for the ViewsTheme Shopware 6.7 storefront plugin.

**Source of truth** for APIs, conventions, and features. Change rule text here — not in `AGENTS.md`.

Convention changes: edit the **topic page** only. Update [hard-rules.md](conventions/hard-rules.md) only when a checklist link is added or removed.

## Contents

| Section | Description |
|---------|-------------|
| [Getting started](getting-started.md) | Install, activate, compile |
| [Architecture](architecture.md) | Plugin layout and layers |
| [Configuration](configuration.md) | Plugin config, `theme.json`, design tokens |
| [Hard rules](conventions/hard-rules.md) | Agent checklist (links into topic docs) |
| [Conventions](conventions/ux-components.md) | UX components, CSS, JS |
| [Twig extensions](twig/overview.md) | `vi_icon`, `vi_define_cva` / `vi_class`, `vi_define_attrs` / `vi_attrs` |
| [Features](features/variants-grid.md) | Variants grid, preferred delivery date, search overlay, navigation drawer/bar, cart drawer, wishlist, account action, language/currency switch, form input, product box, buy container, product listing, pagination, sorting, filters, breadcrumb |

## Conventions

- [Hard rules (checklist)](conventions/hard-rules.md)
- [Agent workflow](conventions/agent-workflow.md) (holistic refactors; no build steps; surgical edits)
- [UX Twig components](conventions/ux-components.md) (target)
- [CSS class API](conventions/css-classes.md) (UX notes; CSS vars; **px** lengths)
- [JavaScript selectors](conventions/javascript.md)
- [Component templates](conventions/components.md)

## Twig

- [Overview](twig/overview.md)
- [`vi_define_cva` / `vi_class`](twig/vi-cva.md)
- [`vi_define_attrs` / `vi_attrs`](twig/vi-attrs.md)
- [`vi_icon`](twig/vi-icon.md)
- [`vi_define_classes`](twig/vi-define-classes.md) (removed)
- [`vi_attr_classes`](twig/vi-attr-classes.md) (removed)
- [`vi_classes`](twig/vi-classes.md) (removed)

## Features

- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
- [Search overlay](features/search-overlay.md)
- [Navigation drawer](features/navigation-drawer.md)
- [Navigation bar](features/navigation-bar.md)
- [Cart drawer](features/cart-drawer.md)
- [Wishlist](features/wishlist.md)
- [Account action](features/account-action.md)
- [Language switch](features/language-switch.md)
- [Currency switch](features/currency-switch.md)
- [Form input](features/form-input.md)
- [Product box](features/product-box.md)
- [Buy container](features/buy-container.md)
- [Product listing](features/product-listing.md)
- [Grid](features/grid.md)
- [Pagination](features/pagination.md)
- [Sorting](features/sorting.md)
- [Filters](features/filters.md)
- [Breadcrumb](features/breadcrumb.md)

## Related

- Root [README](../README.md) — product overview and quick install
- [AGENTS.md](../AGENTS.md) — AI agent routing (no convention prose)
