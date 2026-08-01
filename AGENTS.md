# Agent Instructions

- Context for AI agents working on the `ViewsTheme` project
- **Conventions SoT:** [`docs/`](docs/README.md). Do not put rule prose here.
- After each change, update the relevant **`docs/`** pages. Touch this file only for agent routing or project overview.
- Convention changes: edit the **topic doc** only; update [hard-rules.md](docs/conventions/hard-rules.md) only if a checklist link is added/removed.

## Project Overview

Shopware 6.7 storefront theme (`fyrst/views-theme`) with high-fidelity ecommerce UI (Twig/SCSS/JS). Desktop (1280px+) and mobile (375px).

Requires **Shopware Storefront ≥ 6.7.11** (UX Twig components).

## Before coding

1. Open [docs/conventions/hard-rules.md](docs/conventions/hard-rules.md) and follow the linked topic docs.
2. For feature work, also open the matching page under [docs/features/](docs/features/).

Full index: [docs/README.md](docs/README.md).

## Agents

| Agent | Path | Trigger |
|-------|------|---------|
| **Shopware Developer** | [`.opencode/agents/shopware-developer.md`](.opencode/agents/shopware-developer.md) | Theme scaffolding, Twig, JS plugins, SCSS, CMS, services, migrations |

## Quick reference (docs)

| Topic | Doc |
|-------|-----|
| **Hard rules** (checklist) | [docs/conventions/hard-rules.md](docs/conventions/hard-rules.md) |
| **Agent workflow** (refactors; no builds) | [docs/conventions/agent-workflow.md](docs/conventions/agent-workflow.md) |
| **UX Twig components** (prop defaults, class components) | [docs/conventions/ux-components.md#props](docs/conventions/ux-components.md#props) |
| Component templates | [docs/conventions/components.md](docs/conventions/components.md) |
| CSS vars (critical) | [docs/conventions/css-classes.md](docs/conventions/css-classes.md#css-custom-properties-critical) |
| JS: `data-component` | [docs/conventions/javascript.md](docs/conventions/javascript.md) |
| Twig extensions | [docs/twig/overview.md](docs/twig/overview.md) |
| Variants grid | [docs/features/variants-grid.md](docs/features/variants-grid.md) |
| Preferred delivery date | [docs/features/delivery-date.md](docs/features/delivery-date.md) |
| Search overlay | [docs/features/search-overlay.md](docs/features/search-overlay.md) |
| Navigation drawer | [docs/features/navigation-drawer.md](docs/features/navigation-drawer.md) |
| Navigation bar / flyout | [docs/features/navigation-bar.md](docs/features/navigation-bar.md) |
| Cart drawer | [docs/features/cart-drawer.md](docs/features/cart-drawer.md) |
| Wishlist | [docs/features/wishlist.md](docs/features/wishlist.md) |
| Account action | [docs/features/account-action.md](docs/features/account-action.md) |
| Language switch | [docs/features/language-switch.md](docs/features/language-switch.md) |
| Currency switch | [docs/features/currency-switch.md](docs/features/currency-switch.md) |
| Form input | [docs/features/form-input.md](docs/features/form-input.md) |
| Product box | [docs/features/product-box.md](docs/features/product-box.md) |
| Product listing | [docs/features/product-listing.md](docs/features/product-listing.md) |
| Pagination | [docs/features/pagination.md](docs/features/pagination.md) |
| Sorting | [docs/features/sorting.md](docs/features/sorting.md) |
| Plugin / theme / design tokens | [docs/configuration.md](docs/configuration.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
