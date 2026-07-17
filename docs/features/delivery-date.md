# Preferred delivery date

Optional "preferred delivery date" picker on the checkout confirm page. The selected date is persisted as a custom field on the order.

## Features

- Native `<input type="date">` picker on `checkout/confirm` alongside the customer comment
- Min date is today (never in the past); max date is today plus a configurable number of days
- Submitted with the standard confirm-order form — no custom AJAX route for persistence
- Preferred, not required: empty value writes no custom field
- Configurable order custom-field key (default `preferred_delivery_date`)
- Master toggle via plugin configuration

## Configuration

| Setting | Config key | Default |
|---------|------------|---------|
| Active | `ViewsTheme.config.deliveryDateActive` | off |
| Custom field key | `ViewsTheme.config.deliveryDateCustomFieldKey` | `preferred_delivery_date` |
| Maximum days from today | `ViewsTheme.config.deliveryDateMaxDays` | `30` |

See [Configuration](../configuration.md).

## How it works

### Component

Rendered by `<twig:ViewsTheme:Checkout:DeliveryDateSelection />` from the `page_checkout_additional` block of the confirm-page override (`storefront/page/checkout/confirm.html.twig`).

Conventions:

- UX component (`cva` + `attributes`)
- `data-component="ViewsTheme:Checkout:DeliveryDateSelection"` for co-located JS
- Input attached via `form="confirmOrderForm"` and `name="viewsThemeDeliveryDate"`

### Page subscriber

`CheckoutConfirmPageSubscriber` on `CheckoutConfirmPageLoadedEvent` attaches field configuration under `page.extensions.viewsTheme.deliveryDate`:

| Key | Meaning |
|-----|---------|
| `active` | Feature enabled |
| `min` | Earliest selectable date (today) |
| `max` | Latest selectable date |
| `customFieldKey` | Order custom-field key |

The component renders nothing when inactive.

### Persistence

`CheckoutOrderPlacedSubscriber` on `CheckoutOrderPlacedEvent`:

1. Reads `viewsThemeDeliveryDate` from the request
2. Validates as an ISO date within the allowed window
3. Writes to the order custom fields via `order.repository` using the configured key

Empty or invalid values are silently ignored.

### Storefront JavaScript

Co-located `Checkout/DeliveryDateSelection.js` (`ShopwareComponent`) reads `min` / `max` from the input and clamps out-of-window values on change.

## Key source files

| Area | Path |
|------|------|
| Confirm page subscriber | `src/Subscriber/CheckoutConfirmPageSubscriber.php` |
| Order placed subscriber | `src/Subscriber/CheckoutOrderPlacedSubscriber.php` |
| Component | `src/Resources/views/components/Checkout/DeliveryDateSelection.html.twig` |
| JS | `src/Resources/views/components/Checkout/DeliveryDateSelection.js` |
