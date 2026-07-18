# Agent Instructions

- Context for AI agents working on the `ViewsTheme` project
- After each change, check whether **README**, **AGENTS**, and the relevant **`docs/`** pages still match the code

## Project Overview

Shopware 6.7 storefront theme (`fyrst/views-theme`) with high-fidelity ecommerce UI (Twig/SCSS/JS). Desktop (1280px+) and mobile (375px).

Requires **Shopware Storefront ≥ 6.7.11** (UX Twig components).

**Human docs (source of truth for APIs and features):** [`docs/README.md`](docs/README.md)

## Agents

| Agent | Path | Trigger |
|-------|------|---------|
| **Shopware Developer** | [`.opencode/agents/shopware-developer.md`](.opencode/agents/shopware-developer.md) | Theme scaffolding, Twig, JS plugins, SCSS, CMS, services, migrations |

## Quick reference (code)

| Topic | Doc |
|-------|-----|
| **UX Twig components** (target) | [docs/conventions/ux-components.md](docs/conventions/ux-components.md) |
| Component template rules | [docs/conventions/components.md](docs/conventions/components.md) |
| JS: `data-component` / `data-ref` | [docs/conventions/javascript.md](docs/conventions/javascript.md) |
| Twig extensions | [docs/twig/overview.md](docs/twig/overview.md) |
| Variants grid | [docs/features/variants-grid.md](docs/features/variants-grid.md) |
| Preferred delivery date | [docs/features/delivery-date.md](docs/features/delivery-date.md) |
| Plugin / theme config | [docs/configuration.md](docs/configuration.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |

### Hard rules (always)

- **New / migrated** components: UX tags `<twig:ViewsTheme:…>`, `{% props %}`, `vi_cva()` + `cva = {}` prop + `attributes`, BEM roots with **`vi-`** prefix. See [ux-components.md](docs/conventions/ux-components.md) and [vi-cva.md](docs/twig/vi-cva.md).
- Interactive UX roots: `data-component="ViewsTheme:…"`. Internal hooks: **`data-ref`**. Never CSS classes as JS selectors.
- Co-located interactive JS: `ShopwareComponent` in `<Name>.js` next to `<Name>.html.twig` (no new PluginManager plugins).
- `vi_icon` remains for icons.
- **Do not create** new templates under `src/Resources/views/storefront/`. Only edit existing storefront files when wiring an already-present include to a migrated component.
- **Do not reintroduce** `vi_define_classes` / `vi_attr_classes` / `vi_classes`.

## Design System Summary

- **Style**: Modern Minimal
- **Font**: Figtree
- **Accent**: `#19BF56` (light), `#A3EFAC` (dark variable-ready)
- **Base grid**: 8px
