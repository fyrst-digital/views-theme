# Twig extensions

ViewsTheme registers Twig helpers under the `vi_` prefix.

| Name | Type | Purpose |
|------|------|---------|
| [`vi_icon`](vi-icon.md) | function | Inline SVG or CSS icon markup |
| [`vi_define_cva` / `vi_class`](vi-cva.md) | function | Bind CVA + resolve class strings (no `{% set cx %}`) |
| [`vi_define_attrs` / `vi_attrs`](vi-attrs.md) | function | Bind/resolve nest attribute bags (no `{% set attrs %}`) |
| `vi_merge_deep` | filter | Deep array merge (utility; prefer `replace_recursive` for classes) |

Aliases: `vi_cva` / `vi_cva_from_file` → `vi_define_cva`.

## Removed

- `{% set cx %}` / `{% set classes %}` / `{% set attrs %}` as the primary API
- Standalone `vi_define_classes` (folded into `vi_define_cva` export list)
- Legacy pre-UX `vi_attr_classes` / map-style class APIs

## Implementation

| Extension class | File |
|-----------------|------|
| `Fyrst\ViewsTheme\Twig\ViIcon` | `src/Twig/ViIcon.php` |
| `Fyrst\ViewsTheme\Twig\ViUtilities` | `src/Twig/ViUtilities.php` |
| `Fyrst\ViewsTheme\Twig\ViCvaSlot` | `src/Twig/ViCvaSlot.php` |

## Conventions

- [UX components](../conventions/ux-components.md)
- [Component templates](../conventions/components.md)
