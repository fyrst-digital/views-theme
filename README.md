# ViewsTheme

A Shopware 6.7 storefront theme focused on high-fidelity ecommerce UI design.

## Installation

Place the plugin in your Shopware installation under `custom/static-plugins/ViewsTheme`, then install and activate it:

```bash
bin/console plugin:install --activate ViewsTheme
```

## Twig Extensions

### `vi_define_classes`

Allows components to define default CSS classes while letting parent templates inject additional classes or completely override them.

#### Purpose

This function provides a consistent way to handle CSS class composition in reusable Twig components. It ensures that:

- Components always have their required base styles
- Parent templates can extend or override classes without messy string concatenation
- Class conflicts are resolved predictably through merge or replace strategies

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `defaultClasses` | `array` | *required* | Base class map with semantic keys (e.g., `main`, `inner`, `title`) |
| `customClasses` | `array` | `[]` | Incoming classes from a parent template |
| `replace` | `bool` | `false` | If `true`, replaces default classes; otherwise merges them |

#### Usage Example

```twig
{# In your component template #}
{% set classes = vi_define_classes({
    main: [
        'd-grid',
        'flex-wrap',
    ],
}, classes|default({}), replaceClasses|default(false)) %}

{% block component_header_main %}
  <div 
    class="{{ classes.main|vi_attr_classes }}"
    data-component="header-main">
  </div>
{% endblock %}
```

When including this component from a parent template, you can pass custom classes:

```twig
{# Merge additional classes (default behavior) #}
{% sw_include '@Storefront/components/header/main.html.twig' with {
    classes: {
        main: ['custom-class', 'another-class']
    }
} %}

{# Result: class="d-grid flex-wrap custom-class another-class" #}

{# Completely replace default classes #}
{% sw_include '@Storefront/components/header/main.html.twig' with {
    classes: {
        main: ['custom-class']
    },
    replaceClasses: true
} %}

{# Result: class="custom-class" #}
```

#### Behavior

- **Merge mode** (`replace = false`, default): Uses `array_merge_recursive` to combine classes. Both default and custom classes are preserved.
- **Replace mode** (`replace = true`): Uses `array_replace_recursive` to override default classes with custom ones. If a key exists in both arrays, the custom value wins.

### `vi_attr_classes`

Converts a class array into a clean, HTML-ready class string.

#### Purpose

Instead of writing `{{ classes.main|join(' ') }}` in every template, this filter handles class formatting for you. It removes empty values, deduplicates classes, and joins them with a single space.

#### Usage Example

```twig
{# Before #}
<div class="{{ classes.main|join(' ') }}"></div>

{# After #}
<div class="{{ classes.main|vi_attr_classes }}"></div>
```

Combined with `vi_define_classes`:

```twig
{% set classes = vi_define_classes({
    main: [
        'd-grid',
        'flex-wrap',
    ],
}, classes|default({}), replaceClasses|default(false)) %}

<div class="{{ classes.main|vi_attr_classes }}" data-component="header-main"></div>
```

#### Behavior

- Filters out empty, `null`, or `false` values
- Removes duplicate class names
- Joins remaining classes with a single space
- Returns an empty string if the input array is empty or `null`

## Requirements

- Shopware 6.7 (Core & Storefront)

## License

MIT
