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
| [Twig extensions](twig/overview.md) | `vi_icon`, `vi_cva`, `vi_cva_from_file`, utilities |
| [Features](features/variants-grid.md) | Variants grid, preferred delivery date, search overlay |

## Conventions

- [Hard rules (checklist)](conventions/hard-rules.md)
- [UX Twig components](conventions/ux-components.md) (target)
- [CSS class API](conventions/css-classes.md) (legacy + UX notes)
- [JavaScript selectors](conventions/javascript.md)
- [Component templates](conventions/components.md)

## Twig

- [Overview](twig/overview.md)
- [`vi_cva` / `vi_cva_from_file`](twig/vi-cva.md)
- [`vi_icon`](twig/vi-icon.md)
- [`vi_define_classes`](twig/vi-define-classes.md) (removed)
- [`vi_attr_classes`](twig/vi-attr-classes.md) (removed)
- [`vi_classes`](twig/vi-classes.md) (removed)

## Features

- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
- [Search overlay](features/search-overlay.md)

## Related

- Root [README](../README.md) — product overview and quick install
- [AGENTS.md](../AGENTS.md) — AI agent routing (no convention prose)
