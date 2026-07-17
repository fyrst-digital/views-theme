# CSS class API

## Migrated components (UX)

Use **CVA + attributes** — see [UX Twig components](ux-components.md).

- Root: `vi-*` BEM class + Bootstrap utilities in `defaultBaseClasses`
- Parent extras: HTML `class="…"` on the component tag
- Nested slots: `slot:class="…"` / `attributes.nested('slot')`

Do **not** introduce new `vi_define_classes` usage.

## Legacy components (until domain is migrated)

Unmigrated templates still use the class map API:

| Name | Kind | Role |
|------|------|------|
| `vi_define_classes` | function | Class map (defaults + variants + parent overrides) |
| `vi_attr_classes` | filter | Full `class="…"` attribute |
| `vi_classes` | filter | Bare class string |

Reference: [Twig — `vi_define_classes`](../twig/vi-define-classes.md).

### Legacy pattern

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

### Rules (legacy)

- Default is **merge** (append + dedupe). Fully set slots with `replace` / `replaceClasses: ['key']`.
- Prefer variants + props for closed sets (type, size).
- No `|join(' ')` for class maps.
- This API will be **removed** after all components migrate to UX.

## Related

- [UX components](ux-components.md)
- [Component templates](components.md)
