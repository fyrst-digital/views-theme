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

Root BEM: `vi-*` prefix + utilities in slot `base`.

- **Bootstrap** utilities: `d-flex`, `gap-2`, `p-3`, … (existing CVA)
- **Tailwind** utilities: always `tw:`-prefixed (`tw:flex`, `tw:lg:gap-4`) so they never collide with Bootstrap

Prefer one system per property on a node (do not mix e.g. `gap-2` and `tw:gap-4` on the same element). Global component overrides/tokens: Tailwind-built `assets/css/theme.css` (source: `app/storefront/src/css/`). See [Configuration — Tailwind CSS](../configuration.md#tailwind-css-themecss).

Always call `vi_cva` / `vi_cva_from_file` **before** rendering `attributes` / `attributes.defaults()`.

**Never** put `class` / `slot:class` inside `.defaults({…})` — use `class="{{ cx.…apply() }}"` (or `slot:class="…"`) on the tag. See [UX components — Attributes](ux-components.md#attributes).

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
