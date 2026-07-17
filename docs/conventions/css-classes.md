# CSS class API

## Current standard (UX)

Components use **CVA + attributes**. See [UX Twig components](ux-components.md).

- Root: `vi-*` BEM class + Bootstrap utilities in `defaultBaseClasses`
- Parent extras: HTML `class="…"` on the component tag
- Nested slots: `slot:class="…"` / `attributes.nested('slot')`

## Removed legacy API

`vi_define_classes`, `vi_attr_classes`, and `vi_classes` have been **removed**. Do not reintroduce them.

Historical docs (for reference only):

- [vi_define_classes](../twig/vi-define-classes.md)
- [vi_attr_classes](../twig/vi-attr-classes.md)
- [vi_classes](../twig/vi-classes.md)

## Related

- [UX components](ux-components.md)
- [Component templates](components.md)
