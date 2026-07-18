# CSS class API

## Current standard (UX)

Components use **[`vi_cva`](../twig/vi-cva.md)** + attributes.

| Concern | Mechanism |
|---------|-----------|
| Default CVA config | Inline slot map (`root`, nested slots) passed to `vi_cva` |
| Caller CVA override | `:cva="{ … }"` deep-merged via `replace_recursive` |
| Root extra classes | `class="…"` on the component tag |
| Nested slot extras | `slot:class="…"` |
| Composition | `{% set cx = vi_cva({ … }\|replace_recursive(cva)) %}` then `cx.root.apply({ … })` |

Root BEM: `vi-*` prefix + Bootstrap utilities in slot `base`.

Always call `vi_cva` **before** rendering `attributes` / `attributes.defaults()`.

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
