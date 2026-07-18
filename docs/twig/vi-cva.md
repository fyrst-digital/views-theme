# `vi_cva`

Twig function that maps a multi-slot `classes` config to CVA slots and binds attribute class extras. Implemented in `src/Twig/ViUtilities.php` / `src/Twig/ViCvaSlot.php`.

## Signature

```twig
{% set cx = vi_cva(classes, attributes) %}
```

| Argument | Type | Description |
|----------|------|-------------|
| `classes` | `array` | Slot map: each key is a DOM slot (`root`, `label`, …) |
| `attributes` | `ComponentAttributes` | UX component attributes bag |

Returns `array<string, ViCvaSlot>`.

## Slot config shape

```twig
{
    root: {
        base: 'vi-header …',
        variants: {
            size: { md: 'container-md' }
        },
        compoundVariants: [],   {# optional #}
        defaultVariants: {},    {# optional #}
    },
    label: {
        base: 'vi-header__label',
        variants: { size: { md: 'label-md' } }
    }
}
```

Keys match CVA options: `base`, `variants`, `compoundVariants`, `defaultVariants`.

## Attribute mapping

| Slot | Extra classes from |
|------|--------------------|
| `root` | `class="…"` → `attributes.render('class')` |
| other (`label`, …) | `label:class="…"` → `attributes.nested('label').render('class')` |

Call `vi_cva` **before** rendering `{{ attributes }}` so root `class` is consumed.

## Usage

```twig
{% props
    size = 'md',
    classes = {},
%}

{% set defaultClasses = {
    root: {
        base: 'vi-page-header',
        variants: { size: { md: 'container-md' } },
    },
    label: {
        base: 'vi-page-header__label',
        variants: { size: { md: 'label-md' } },
    },
} %}

{% set classes = defaultClasses|replace_recursive(classes) %}
{% set cx = vi_cva(classes, attributes) %}

<div {{ attributes }} class="{{ cx.root.apply({ size: size }) }}">
    <label class="{{ cx.label.apply({ size: size }) }}">…</label>
</div>
```

### Caller overrides

```twig
{# Deep-merge CVA config #}
<twig:ViewsTheme:Page:Header :classes="{ root: { base: 'header' } }" />

{# Extra HTML classes #}
<twig:ViewsTheme:Page:Header class="mt-2" label:class="fw-bold" />
```

### `ViCvaSlot`

| Method | Description |
|--------|-------------|
| `apply(recipes = {})` | Resolve variants + bound attribute classes → class string |
| string cast | Same as `apply({})` |

Variant **values** stay explicit in `.apply({ … })` (component props). Only config + attribute classes are auto-mapped.

## Related

- [CSS class API](../conventions/css-classes.md)
- [UX components](../conventions/ux-components.md)
- Shopware `replace_recursive` for deep prop merge (prefer over `vi_merge_deep`)
