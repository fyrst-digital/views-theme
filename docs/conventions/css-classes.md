# CSS class API

Components under `src/Resources/views/components/` use a shared class map API so parents can extend or fully set slots without string concatenation.

## Definer and compositors

| Name | Kind | Role |
|------|------|------|
| `vi_define_classes` | function | Build the class map (defaults + variants + parent overrides) |
| `vi_attr_classes` | filter | Full `class="…"` attribute for HTML tags |
| `vi_classes` | filter | Bare class string for forms / attribute bags |

Full reference: [Twig — `vi_define_classes`](../twig/vi-define-classes.md).

## Component pattern

```twig
{%
  set classes = vi_define_classes({
    main: ['component-main', 'd-flex'],
  }, classes|default({}), {
    replace: replaceClasses|default([]),
  })
%}

<div {{ classes.main | vi_attr_classes }} data-component="example">
```

## Rules

- Default is always **merge** (append + dedupe). There is no global bool replace.
- Fully set selected slots with `replace` / `replaceClasses: ['key']`.
- Prefer **variants** + `props` for closed prop sets (type, size, state).
- Prefer `vi_define_classes(base, override)` over `vi_merge_deep` when composing child class maps.
- Do **not** use `defaultClasses`, `class="{{ classes.x|join(' ') }}"`, or `|join(' ')` for class maps.
- Shell/router templates and `icon/icon.html.twig` are exempt.
- Shopware UX / CVA is deferred to a 6.8 compatibility track.

## Parent include examples

```twig
{# Merge (default) #}
{%
  sw_include '@Storefront/components/header/main.html.twig' with {
    classes: {
      main: ['custom-class', 'another-class']
    }
  }
%}

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
```

## Related

- [Component templates](components.md)
- [JavaScript selectors](javascript.md)
