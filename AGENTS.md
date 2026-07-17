# Agent Instructions

- Context for AI agents working on the `ViewsTheme` project
- After each change, check whether **README**, **AGENTS**, and the relevant **`docs/`** pages still match the code

## Project Overview

Shopware 6.7 storefront theme (`fyrst/views-theme`) with high-fidelity ecommerce UI (Twig/SCSS/JS). Desktop (1280px+) and mobile (375px).

**Human docs (source of truth for APIs and features):** [`docs/README.md`](docs/README.md)

## Agents

| Agent | Path | Trigger |
|-------|------|---------|
| **Shopware Developer** | [`.opencode/agents/shopware-developer.md`](.opencode/agents/shopware-developer.md) | Theme scaffolding, Twig, JS plugins, SCSS, CMS, services, migrations |

## Quick reference (code)

Do not re-document full APIs here — link to docs.

| Topic | Doc |
|-------|-----|
| CSS class API (`vi_define_classes`, merge/replace/variants) | [docs/conventions/css-classes.md](docs/conventions/css-classes.md) |
| Component template rules | [docs/conventions/components.md](docs/conventions/components.md) |
| JS: only `[data-component="…"]` selectors | [docs/conventions/javascript.md](docs/conventions/javascript.md) |
| Twig extensions | [docs/twig/overview.md](docs/twig/overview.md) |
| Variants grid | [docs/features/variants-grid.md](docs/features/variants-grid.md) |
| Preferred delivery date | [docs/features/delivery-date.md](docs/features/delivery-date.md) |
| Plugin / theme config | [docs/configuration.md](docs/configuration.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |

### Hard rules (always)

- Components under `src/Resources/views/components/`: use `vi_define_classes` + `vi_attr_classes` / `vi_classes` (see docs). No `|join(' ')` for class maps.
- **Never** use CSS classes as JavaScript selectors — only `data-component`.
- Prefer `vi_define_classes(base, override)` over `vi_merge_deep` for class maps.
- Shell/router templates and `icon/icon.html.twig` are exempt from the class map API.

## Design System Summary

- **Style**: Modern Minimal
- **Font**: Figtree
- **Accent**: `#19BF56` (light), `#A3EFAC` (dark variable-ready)
- **Base grid**: 8px
