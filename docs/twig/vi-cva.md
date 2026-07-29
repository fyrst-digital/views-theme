# `vi_cva` / `vi_cva_from_file`

Twig functions that map a multi-slot CVA config to bound slots and pull attribute class extras. Implemented in `src/Twig/ViUtilities.php` / `src/Twig/ViCvaSlot.php`.

Uses [`Twig\Extra\Html\Cva`](https://twig.symfony.com/html_cva) from `twig/html-extra` (not the deprecated Symfony UX `cva` / `Symfony\UX\TwigComponent\CVA`).

## Signatures

```twig
{% set cx = vi_cva(config) %}
{% set cx = vi_cva(config, attributes) %}

{% set cx = vi_cva_from_file(cva) %}
{% set cx = vi_cva_from_file(cva, attributes) %}
{% set cx = vi_cva_from_file(cva, '@ViewsTheme/components/Alert.cva.twig') %}
{% set cx = vi_cva_from_file(cva, 'Alert') %}
```

| Function | Description |
|----------|-------------|
| `vi_cva` | Inline config map + attribute binding |
| `vi_cva_from_file` | Load co-located / explicit `.cva.twig`, merge `cva` overrides, then same binding as `vi_cva` |

| Argument | Type | Description |
|----------|------|-------------|
| `config` | `array` | Slot map: each key is a DOM slot (`root`, `label`, …) |
| `cva` | `array` | Caller overrides (deep-merged via `array_replace_recursive`) |
| `attributes` | `ComponentAttributes` | Optional; defaults to component `attributes` from context |
| template ref (2nd arg) | `string` | Optional explicit `.cva.twig` path, `.html.twig` sibling, or short name (`Alert`, `Product/Box`) |

Returns `array<string, ViCvaSlot>`. Updates context `attributes` so nested `slot:class` keys are stripped after binding.

## Prefer file-based defaults

For multi-slot or variant-heavy components, keep defaults in a **sibling** file:

```text
Alert.html.twig
Alert.cva.twig
Product/Box.html.twig
Product/Box.cva.twig
```

```twig
{# Alert.html.twig #}
{% props cva = {} %}
{% set cx = vi_cva_from_file(cva) %}
```

Auto-resolution: caller `Name.html.twig` → sibling `Name.cva.twig` (via UX component stack, else render backtrace). Tiny maps may stay inline with `vi_cva`.

### `.cva.twig` format

A single Twig **hash expression** (not a full template). Optional `{# comments #}` only.

```twig
{# QuantityInput.cva.twig #}
{
    root: {
        base: 'vi-quantity-input input-group …',
        variants: {
            size: { sm: 'input-group-sm' },
        },
    },
    decrease: { base: 'vi-quantity-input__decrease …' },
    input: { base: '…' },
}
```

Evaluated with the **component context**, so dynamic bases work:

```twig
{# Product/Box.cva.twig #}
{
    root: { base: 'vi-product-box product-box layout-' ~ resolvedLayout },
    content: { base: 'vi-product-box__content' },
}
```

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
| other (`label`, …) | `label:class="…"` → nested class, then removed from attributes bag |

Call `vi_cva` / `vi_cva_from_file` **before** rendering `{{ attributes }}` so root `class` is consumed.

## Usage

### Inline (small components)

```twig
{% props
    size = 'md',
    cva = {},
%}

{% set cx = vi_cva({
    root: {
        base: 'vi-page-header',
        variants: { size: { md: 'container-md' } },
    },
    label: {
        base: 'vi-page-header__label',
        variants: { size: { md: 'label-md' } },
    },
}|replace_recursive(cva)) %}

<div {{ attributes }} class="{{ cx.root.apply({ size: size }) }}">
    <label class="{{ cx.label.apply({ size: size }) }}">…</label>
</div>
```

### File-based (default for larger maps)

```twig
{% props size = 'md', cva = {} %}
{% set cx = vi_cva_from_file(cva) %}

<div {{ attributes }} class="{{ cx.root.apply({ size: size }) }}">
    …
</div>
```

### Caller overrides

```twig
{# Deep-merge CVA config #}
<twig:ViewsTheme:Page:Header :cva="{ root: { base: 'header' } }" />

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
- Shopware `replace_recursive` for deep prop merge (prefer over `vi_merge_deep`) when using inline `vi_cva`
