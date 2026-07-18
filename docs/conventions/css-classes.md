# CSS class API

## Current standard (UX)

Components use **[`vi_cva`](../twig/vi-cva.md)** / **`vi_cva_from_file`** + attributes.

| Concern | Mechanism |
|---------|-----------|
| Default CVA config | Sibling `Name.cva.twig` via `vi_cva_from_file(cva)`, or inline map for small components |
| Caller CVA override | `:cva="{ … }"` deep-merged into defaults |
| Root extra classes | `class="…"` on the component tag |
| Nested slot extras | `slot:class="…"` |
| Composition | `{% set cx = vi_cva_from_file(cva) %}` or `vi_cva({ … }\|replace_recursive(cva))` then `cx.root.apply({ … })` |

Root BEM: `vi-*` prefix + Bootstrap utilities in slot `base`.

Always call `vi_cva` / `vi_cva_from_file` **before** rendering `attributes` / `attributes.defaults()`.

### When to use a `.cva.twig` file

Prefer a sibling file when the map has many slots, variants, or hurts template readability. Keep a 2–3 slot static map inline if clearer.

```text
Alert.html.twig
Alert.cva.twig      # hash expression only
```

## Removed legacy API

`vi_define_classes`, `vi_attr_classes`, `vi_classes`, and root props `defaultBaseClasses` / `defaultVariants` have been **removed**. Do not reintroduce them.

Historical docs (for reference only):

- [vi_define_classes](../twig/vi-define-classes.md)
- [vi_attr_classes](../twig/vi-attr-classes.md)
- [vi_classes](../twig/vi-classes.md)

## Related

- [`vi_cva`](../twig/vi-cva.md)
- [UX components](ux-components.md)
- [Component templates](components.md)
