# Agent Instructions

- This file provides context for AI agents working on the `ViewsTheme` project
- After each change check if the README and AGENTS md is in line with those changes

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

## CSS class API convention

Components under `src/Resources/views/components/` use a shared CSS class API:

```twig
{%
  set classes = vi_define_classes({
    main: ['component-main', 'd-flex'],
  }, classes|default({}), replaceClasses|default(false))
%}

<div {{ classes.main | vi_attr_classes }} data-component="example">
```

- **Definer:** `vi_define_classes`
- **Compositor:** `vi_attr_classes` filter (emits full `class="..."`)
- Do **not** use `defaultClasses` + `vi_merge_deep` or `class="{{ classes.x|join(' ') }}"` for component-owned HTML
- `join(' ')` is only allowed for Shopware form `additionalClass` strings and media attribute bags
- Shell/router templates and `icon/icon.html.twig` are exempt

## JavaScript selector convention

This plugin uses `data-component` attributes as the only JavaScript selectors.

**Never use CSS classes as JavaScript selectors.** CSS classes are for styling only and may change without notice.

### When adding new interactive elements / components

1. Add a `data-component="<component-name>"` attribute to the element in Twig.
2. Use `[data-component="<component-name>"]` as the selector in JavaScript.

### Variants Grid components

The variants grid is integrated into the `buy-container` component. The `ProductPageSubscriber` attaches grid data to the page under `page.extensions.viewsTheme.variantsGrid`.

| Component      | Attribute                        | Element                                    |
|----------------|----------------------------------|--------------------------------------------|
| Grid container | `data-component="variants-grid"`   | Wrapper around the grid form               |
| Grid body      | `data-component="grid-body"`       | `<tbody>` — target for AJAX row injection  |
| Pagination     | `data-component="pagination"`      | Wrapper around pagination controls         |
| Quantity input | `data-component="quantity-input"`  | Per-variant quantity spinbutton            |
| Buy button     | `data-component="buy-button"`    | "Add all to cart" submit button            |
| Grid memory    | `data-component="grid-memory"`     | Hidden container for cross-page inputs     |
| Live region    | `data-component="live-region"`     | Screen-reader announcement for page loads  |
| Error message  | `data-component="error-message"`   | Inline alert shown on AJAX failures        |

### Checkout components

The preferred delivery date is rendered on the checkout confirm page. The `CheckoutConfirmPageSubscriber` attaches the field configuration to the page under `page.extensions.viewsTheme.deliveryDate` (keys: `active`, `min`, `max`, `customFieldKey`). The `CheckoutOrderPlacedSubscriber` persists the submitted date as an order custom field on `CheckoutOrderPlacedEvent`.

| Component              | Attribute                                      | Element                                          |
|------------------------|------------------------------------------------|--------------------------------------------------|
| Delivery date selection| `data-component="delivery-date-selection"`     | Wrapper around the native `<input type="date">`  |

The date input is wired to the standard confirm-order form via `form="confirmOrderForm"` and `name="viewsThemeDeliveryDate"`, so no custom AJAX route is required for persistence. The custom-field key written to the order is configurable via `ViewsTheme.config.deliveryDateCustomFieldKey` (default `preferred_delivery_date`).

## Design System Summary

- **Style**: Modern Minimal
- **Font**: Figtree
- **Accent**: `#19BF56` (light mode), `#A3EFAC` (dark mode variable-ready)
- **Base grid**: 8px

For full design tokens, components, and screen patterns, see the Ecommerce Design skill file.
