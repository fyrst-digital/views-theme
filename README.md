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

## Requirements

- Shopware 6.7 (Core & Storefront)

## License

MIT
