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

Allows components to define default CSS classes while letting parent templates inject additional classes, fully set selected slots, or apply prop-driven variants.

#### Purpose

- Components always have their required base styles
- Parent templates can extend or override classes without string concatenation
- Default mode **merges** class lists; selected slots can be **fully set** via `replaceClasses`
- Closed prop sets (type, size, state) can be expressed as variants

#### Parameters

| Parameter        | Type    | Default    | Description |
| ---------------- | ------- | ---------- | ----------- |
| `defaultClasses` | `array` | _required_ | Base class map (`root`, `title`, nested child slots, …) |
| `customClasses`  | `array` | `[]`       | Incoming classes from a parent template |
| `options`        | `array` | `[]`       | Options object (see below) |

#### Options object (3rd argument)

| Key       | Type       | Description |
| --------- | ---------- | ----------- |
| `replace` | `string[]` | Keys whose values are fully set by `customClasses` (not merged). Alias: `replaceClasses` |
| `variants`| `array`    | Prop → value → partial class map |
| `props`   | `array`    | Current prop values used to pick variants |

#### Simple usage

```twig
{%
  set classes = vi_define_classes({
      main: [
          'd-grid',
          'flex-wrap',
      ],
  }, classes|default({}), {
    replace: replaceClasses|default([]),
  })
%}

{% block component_header_main %}
  <div
    {{ classes.main | vi_attr_classes }}
    data-component='header-main'></div>
{% endblock %}
```

Parent include:

```twig
{# Merge (default) #}
{%
  sw_include '@Storefront/components/header/main.html.twig' with {
      classes: {
          main: ['custom-class', 'another-class']
      }
  }
%}
{# → class="d-grid flex-wrap custom-class another-class" #}

{# Fully set selected slots (others still merge) #}
{%
  sw_include '@Storefront/components/header/main.html.twig' with {
      classes: {
          main: ['custom-class'],
          menu: ['extra'],
      },
      replaceClasses: ['main']
  }
%}
{# main → class="custom-class"
   menu → defaults + extra #}
```

#### Variants + selective replace

```twig
{%
  set classes = vi_define_classes({
    root: ['alert', 'd-flex', 'gap-3'],
    icon: ['alert-icon'],
  }, classes|default({}), {
    replace: replaceClasses|default([]),
    variants: {
      type: {
        danger:  { root: ['alert-danger'] },
        warning: { root: ['alert-warning'] },
        info:    { root: ['alert-info'] },
        success: { root: ['alert-success'] },
      },
      dismissible: {
        true: { root: ['alert-dismissible', 'fade', 'show'] },
      },
    },
    props: {
      type: type|default(null),
      dismissible: dismissible|default(false),
    },
  })
%}
```

#### Behavior

- **Merge (default):** leaf class lists append and dedupe; nested maps merge recursively
- **Replace (`replace` / `replaceClasses: ['main', …]`):** only listed keys are fully set by custom; other keys still merge
- **Variants:** applied after defaults, before custom parent classes
- Leaf values may be arrays or space-separated strings

### `vi_attr_classes`

Converts a class list into a full HTML attribute: `class="a b"`.

```twig
<div {{ classes.main | vi_attr_classes }}></div>
```

- Filters empty / null / false values
- Deduplicates
- Empty input → empty string (no attribute)

### `vi_classes`

Converts a class list into a bare class string (no attribute wrapper). Use when a Shopware API expects a string.

```twig
{# Form field macros #}
additionalClass: classes.email | vi_classes,

{# Media / thumbnail attribute bags #}
attributes: {
  class: classes.image | vi_classes,
}
```

### Component conventions

Every component under `src/Resources/views/components/` that renders styled markup must:

1. Define defaults with `vi_define_classes`
2. Output map keys with `{{ classes.key | vi_attr_classes }}` on HTML tags
3. Use `{{ classes.key | vi_classes }}` only for string APIs (forms, attribute bags)
4. Prefer **variants** / `replaceClasses: ['slot']` over post-define `|merge` hacks
5. Prefer `vi_define_classes(base, override)` over `vi_merge_deep` when composing class maps for child includes

| Pattern | Status |
|---------|--------|
| `vi_attr_classes` on HTML tags | Required |
| `vi_classes` for string slots | Required (do not use `\|join(' ')`) |
| `replaceClasses: ['key']` | Fully set those slots; all other keys merge |
| Runtime list merge via `vi_define_classes` | OK for per-iteration state |
| `icon/icon.html.twig` | Exempt (own dynamic icon API) |
| Shell / router templates | Exempt |

> **Shopware 6.8:** a future track may adopt UX Twig components + CVA. Until then this API is the ViewsTheme standard.

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

The picker is rendered by the `delivery-date-selection` component (`components/checkout/delivery-date-selection.html.twig`), included from the `page_checkout_additional` block of the confirm-page override (`storefront/page/checkout/confirm/index.html.twig`). It follows the theme component conventions: `vi_define_classes` / `vi_attr_classes` for overridable classes and a `data-component="delivery-date-selection"` hook for JavaScript. The `<input>` is attached to the standard order form via `form="confirmOrderForm"` and `name="viewsThemeDeliveryDate"`.

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
