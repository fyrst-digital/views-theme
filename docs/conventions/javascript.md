# JavaScript selector convention

This plugin uses **`data-component` attributes as the only JavaScript selectors**.

**Never use CSS classes as JavaScript selectors.** CSS classes are for styling only and may change without notice.

## Adding interactive elements

1. Add `data-component="<component-name>"` on the element in Twig.
2. Register / select with `[data-component="<component-name>"]` in JavaScript.

## Variants grid

Integrated into the `buy-container` component. Data: `page.extensions.viewsTheme.variantsGrid`.

| Component | Attribute | Element |
|-----------|-----------|---------|
| Grid container | `data-component="variants-grid"` | Wrapper around the grid form |
| Grid body | `data-component="grid-body"` | `<tbody>` — AJAX row injection target |
| Pagination | `data-component="pagination"` | Pagination controls wrapper |
| Quantity input | `data-component="quantity-input"` | Per-variant quantity spinbutton |
| Buy button | `data-component="buy-button"` | "Add all to cart" submit |
| Grid memory | `data-component="grid-memory"` | Hidden container for cross-page inputs |
| Live region | `data-component="live-region"` | Screen-reader page-load announcements |
| Error message | `data-component="error-message"` | Inline alert on AJAX failures |

Plugin: `VariantsGridPlugin` → `[data-component="variants-grid"]`.

See [Variants grid](../features/variants-grid.md).

## Checkout — preferred delivery date

Data: `page.extensions.viewsTheme.deliveryDate` (`active`, `min`, `max`, `customFieldKey`).

| Component | Attribute | Element |
|-----------|-----------|---------|
| Delivery date selection | `data-component="delivery-date-selection"` | Wrapper around `<input type="date">` |

Plugin: `DeliveryDatePlugin` → `[data-component="delivery-date-selection"]`.

See [Preferred delivery date](../features/delivery-date.md).
