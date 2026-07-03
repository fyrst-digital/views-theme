# ViewsTheme

A Shopware 6.7 storefront theme focused on high-fidelity ecommerce UI design.

## Installation

Place the plugin in your Shopware installation under `custom/static-plugins/ViewsTheme`, then install and activate it:

```bash
bin/console plugin:install --activate ViewsTheme
```

## Extended Theme configuration

- In `theme.json` you can set an `icons` property

## Twig Extensions

### `vi_define_classes`

Allows components to define default CSS classes while letting parent templates inject additional classes or completely override them.

#### Purpose

This function provides a consistent way to handle CSS class composition in reusable Twig components. It ensures that:

- Components always have their required base styles
- Parent templates can extend or override classes without messy string concatenation
- Class conflicts are resolved predictably through merge or replace strategies

#### Parameters

| Parameter        | Type    | Default    | Description                                                        |
| ---------------- | ------- | ---------- | ------------------------------------------------------------------ |
| `defaultClasses` | `array` | _required_ | Base class map with semantic keys (e.g., `main`, `inner`, `title`) |
| `customClasses`  | `array` | `[]`       | Incoming classes from a parent template                            |
| `replace`        | `bool`  | `false`    | If `true`, replaces default classes; otherwise merges them         |

#### Usage Example

```twig
{# In your component template #}
{%
  set classes = vi_define_classes({
      main: [
          'd-grid',
          'flex-wrap',
      ],
  }, classes|default({}), replaceClasses|default(false))
%}

{% block component_header_main %}
  <div
    {{ classes.main | vi_attr_classes }}
    data-component='header-main'></div>
{% endblock %}
```

When including this component from a parent template, you can pass custom classes:

```twig
{# Merge additional classes (default behavior) #}
{%
  sw_include '@Storefront/components/header/main.html.twig' with {
      classes: {
          main: ['custom-class', 'another-class']
      }
  }
%}

{# Result: class="d-grid flex-wrap custom-class another-class" #}

{# Completely replace default classes #}
{%
  sw_include '@Storefront/components/header/main.html.twig' with {
      classes: {
          main: ['custom-class']
      },
      replaceClasses: true
  }
%}

{# Result: class="custom-class" #}
```

#### Behavior

- **Merge mode** (`replace = false`, default): Uses `array_merge_recursive` to combine classes. Both default and custom classes are preserved.
- **Replace mode** (`replace = true`): Uses `array_replace_recursive` to override default classes with custom ones. If a key exists in both arrays, the custom value wins.

### `vi_attr_classes`

Converts a class array into a clean, HTML-ready class string.

#### Purpose

Instead of writing `class="{{ classes.main|join(' ') }}"` in every template, this filter outputs the entire `class` attribute for you. It removes empty values, deduplicates classes, and handles the HTML attribute syntax.

#### Usage Example

```twig
{# Before #}
<div class='{{ classes.main|join(' ') }}'></div>

{# After #}
<div {{ classes.main | vi_attr_classes }}></div>
```

Combined with `vi_define_classes`:

```twig
{%
  set classes = vi_define_classes({
      main: [
          'd-grid',
          'flex-wrap',
      ],
  }, classes|default({}), replaceClasses|default(false))
%}

<div {{ classes.main | vi_attr_classes }} data-component='header-main'></div>
```

#### Behavior

- Outputs the full `class="..."` attribute string
- Filters out empty, `null`, or `false` values
- Removes duplicate class names
- Returns an empty string (no attribute) if the input array is empty or `null`

### `vi_icon`

- todo: add description

## Variants Grid

ViewsTheme includes a paginated variants grid on product detail pages for products with variants.

### Features

- Automatically shows a variants grid on any product detail page that has variants.
- Dynamic columns based on the product's configurator groups.
- Quantity input for every variant row.
- Single "Add all to cart" button.
- Server-side filtering of rows with zero quantity via a dedicated controller.
- Seamless lazy-loading pagination via JavaScript fetch.
- Preserved quantities across pagination pages.
- Offcanvas cart opens after adding variants, matching default Shopware behavior.
- Configurable rows per page via plugin configuration.
- Unavailable variants are rendered as disabled rows.
- Color/option media rendered as swatches where applicable.

### Configuration

Open the plugin configuration in the Shopware administration to set:

- **Rows per page** — the maximum number of variants displayed per page in the grid. Default: `10`.
- **Show preview column** — whether the preview (image) column is rendered in the grid. Default: on.
- **Show product number column** — whether the product number (SKU) column is rendered in the grid. Default: on.

Both column options apply to the table header and every row, and are honored on the initial page render as well as on AJAX-paginated page loads.

### How it works

#### Buy container integration

The variants grid is rendered inside the `buy-container` component (`components/product/buy-container.html.twig`) via the `buy_widget_variants_grid` block. The `ProductPageSubscriber` attaches the grid data to the page under `page.extensions.viewsTheme.variantsGrid`.

#### Custom controller

The grid form posts to a dedicated controller:

```
frontend.checkout.variants-grid.add
```

This controller receives every row, ignores entries with `quantity <= 0`, creates the remaining line items, and adds them to the cart. The response is handled by Shopware's core `AddToCartPlugin`, which opens the offcanvas cart.

The same controller also provides an AJAX endpoint for lazy pagination:

```
frontend.checkout.variants-grid.load
```

It returns the rendered table rows and pagination HTML for the requested page. It accepts two optional query parameters (`rowsTemplate`, `paginationTemplate`) for custom Twig templates; both fall back to the defaults if missing or invalid.

#### Storefront JavaScript

The `VariantsGridPlugin` (registered on `[data-component="variants-grid"]`) handles button-state management, AJAX pagination, quantity preservation across pages, and error feedback.

## Preferred Delivery Date

ViewsTheme adds an optional "preferred delivery date" picker to the checkout confirm page. The selected date is persisted as a custom field on the order.

### Features

- Native `<input type="date">` picker rendered on the `checkout/confirm` page alongside the customer comment.
- Min date is today (the date can never lie in the past); max date is today plus a configurable number of days.
- The date is submitted with the standard confirm-order form — no custom AJAX route required for persistence.
- The date is *preferred*, not required: leaving it empty writes no custom field.
- The order custom-field key is configurable; it defaults to `preferred_delivery_date`.
- The whole feature can be toggled on/off via a single plugin configuration flag.

### Configuration

Open the plugin configuration in the Shopware administration to set:

- **Active** — master toggle for the preferred delivery date feature. Default: off.
- **Custom field key** — the order custom-field key the selected date is written under. Default: `preferred_delivery_date`.
- **Maximum days from today** — the upper bound of the selectable window, in days from today. Default: `30`.

### How it works

#### Component

The picker is rendered by the `delivery-date-selection` component (`components/checkout/delivery-date-selection.html.twig`), included from the `page_checkout_additional` block of the confirm-page override (`storefront/page/checkout/confirm/index.html.twig`). It follows the theme component conventions: `vi_define_classes` / `vi_attr_classes` for overridable `checkout-delivery-date-selection-*` classes and a `data-component="delivery-date-selection"` hook for JavaScript. The `<input>` is attached to the standard order form via `form="confirmOrderForm"` and `name="viewsThemeDeliveryDate"`.

#### Page subscriber

The `CheckoutConfirmPageSubscriber` subscribes to `CheckoutConfirmPageLoadedEvent` and attaches the field configuration to the page under `page.extensions.viewsTheme.deliveryDate` (keys: `active`, `min`, `max`, `customFieldKey`). The component renders nothing when the feature is inactive.

#### Persistence

The `CheckoutOrderPlacedSubscriber` subscribes to `CheckoutOrderPlacedEvent`. It reads the submitted `viewsThemeDeliveryDate` value from the request, validates it as an ISO date within the allowed window, and writes it to the order's custom fields via `order.repository` using the configured key. Empty or invalid values are silently ignored (no custom field is written).

#### Storefront JavaScript

The `DeliveryDatePlugin` (registered on `[data-component="delivery-date-selection"]`) reads the `min` / `max` attributes from the input and clamps any out-of-window value on change.

## Requirements

- Shopware 6.7 (Core & Storefront)

## License

MIT
