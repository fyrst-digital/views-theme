# Agent Instructions

This file provides context for AI agents working on the `views-theme` project.

## Project Overview

This is a **Shopware 6 theme design project** focused on creating high-fidelity ecommerce UI mockups in Pencil (`.pen` files). The designs target both desktop (1280px+) and mobile (375px) web storefronts.

## Available Skills

Agents should reference the following skill file when relevant:

| Skill | Path | Trigger |
|-------|------|---------|
| **Ecommerce Design (Pencil)** | [`skills/ecommerce-design/SKILL.md`](skills/ecommerce-design/SKILL.md) | Any ecommerce UI design task in Pencil: product listings, PDP, cart, checkout, navigation, filters, account pages, or storefront components. Also triggered by keywords: shopware, ecommerce, product card, PLP, PDP. |

## Agents

| Agent | Path | Trigger |
|-------|------|---------|
| **Pencil Designer** | [`.opencode/agents/pencil-designer.md`](.opencode/agents/pencil-designer.md) | Ecommerce design work specifically in Pencil. The main agent delegates all screen/component design tasks to this subagent. |
| **Shopware Developer** | [`.opencode/agents/shopware-developer.md`](.opencode/agents/shopware-developer.md) | Code-level Shopware 6.7 tasks: theme scaffolding, Twig overrides, JS plugins, SCSS, CMS blocks, services, migrations. The main agent delegates all storefront coding tasks to this subagent. |

## Quick Start

1. The main design file is [`views-theme.pen`](views-theme.pen).
2. Before designing, initialize design tokens (colors, typography, spacing) using `pencil_set_variables`.
3. Build reusable components in a "Design System" frame first, then assemble screens using `ref` instances.
4. Always create desktop and mobile variants for each screen.
5. Verify designs with `pencil_get_screenshot`.

## Design System Summary

- **Style**: Modern Minimal
- **Font**: Figtree
- **Accent**: `#19BF56` (light mode), `#A3EFAC` (dark mode variable-ready)
- **Base grid**: 8px

For full design tokens, components, and screen patterns, see the Ecommerce Design skill file.
