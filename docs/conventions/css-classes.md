# CSS class API

## Current standard (UX)

Components use **CVA + attributes**. Multi-slot components can use [`vi_cva`](../twig/vi-cva.md).

| Concern | Mechanism |
|---------|-----------|
| Default CVA config | Internal `defaultClasses` map (`root`, nested slots) |
| Caller CVA override | `:classes="{ … }"` deep-merged via `replace_recursive` |
| Root extra classes | `class="…"` on the component tag |
| Nested slot extras | `slot:class="…"` / `attributes.nested('slot')` |
| Composition | `{% set cx = vi_cva(classes, attributes) %}` then `cx.root.apply({ … })` |

Root BEM: `vi-*` prefix + Bootstrap utilities in slot `base`.

Always call `vi_cva` / `attributes.render('class')` **before** rendering `attributes` / `attributes.defaults()`.

## Removed legacy API

`vi_define_classes`, `vi_attr_classes`, and `vi_classes` have been **removed**. Do not reintroduce them.

Historical docs (for reference only):

- [vi_define_classes](../twig/vi-define-classes.md)
- [vi_attr_classes](../twig/vi-attr-classes.md)
- [vi_classes](../twig/vi-classes.md)

## Related

- [`vi_cva`](../twig/vi-cva.md)
- [UX components](ux-components.md)
- [Component templates](components.md)
