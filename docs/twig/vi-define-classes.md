# `vi_define_classes` (legacy map API)

> **Removed** (pre-UX class-map API). Current CVA API: [`vi_define_cva` / `vi_class`](vi-cva.md). Historical reference below.

Allows components to define default CSS classes while letting parent templates inject additional classes, fully set selected slots, or apply prop-driven variants.

## Purpose

- Components always have their required base styles
- Parent templates can extend or override classes without string concatenation
- Default mode **merges** class lists; selected slots can be **fully set** via `replaceClasses`
- Closed prop sets (type, size, state) can be expressed as variants

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `defaultClasses` | `array` | _required_ | Base class map (`root`, `title`, nested child slots, …) |
| `customClasses` | `array` | `[]` | Incoming classes from a parent template |
| `options` | `array` | `[]` | Options object (see below) |

### Options object (3rd argument)

| Key | Type | Description |
|-----|------|-------------|
| `replace` | `string[]` | Keys whose values are fully set by `customClasses` (not merged). Alias: `replaceClasses` |
| `variants` | `array` | Prop → value → partial class map |
| `props` | `array` | Current prop values used to pick variants |

## Simple usage

```twig
{%
  set classes = vi_define_classes({
      root: [
          'd-grid',
          'flex-wrap',
      ],
  }, classes|default({}), {
    replace: replaceClasses|default([]),
  })
%}

<div {{ classes.root | vi_attr_classes }}></div>
```

### Parent include (legacy)

```twig
{# Merge (default) #}
{%
  sw_include '@Storefront/components/example.html.twig' with {
      classes: {
          root: ['custom-class', 'another-class']
      }
  }
%}
{# → class="d-grid flex-wrap custom-class another-class" #}

{# Fully set selected slots (others still merge) #}
{%
  sw_include '@Storefront/components/example.html.twig' with {
      classes: {
          root: ['custom-class'],
          menu: ['extra'],
      },
      replaceClasses: ['root']
  }
%}
{# root → class="custom-class"
   menu → defaults + extra #}
```

For migrated components use `<twig:ViewsTheme:… class="custom-class">` instead — see [UX components](../conventions/ux-components.md).

## Variants + selective replace

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

## Behavior

- **Merge (default):** leaf class lists append and dedupe; nested maps merge recursively
- **Replace (`replace` / `replaceClasses: ['main', …]`):** only listed keys are fully set by custom; other keys still merge
- **Variants:** applied after defaults, before custom parent classes
- Leaf values may be arrays or space-separated strings

## Related

- [`vi_attr_classes`](vi-attr-classes.md)
- [`vi_classes`](vi-classes.md)
- [CSS class conventions](../conventions/css-classes.md)
