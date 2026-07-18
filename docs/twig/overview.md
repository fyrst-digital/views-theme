# Twig extensions

ViewsTheme registers Twig helpers under the `vi_` prefix.

| Name | Type | Purpose |
|------|------|---------|
| [`vi_icon`](vi-icon.md) | function | Inline SVG or CSS icon markup |
| [`vi_cva`](vi-cva.md) | function | Multi-slot CVA map + attribute class binding |
| [`vi_cva_from_file`](vi-cva.md) | function | Load sibling / explicit `.cva.twig` defaults + merge `cva` + bind |
| `vi_merge_deep` | filter | Deep array merge (utility; prefer `replace_recursive` for classes) |

## Removed

`vi_define_classes`, `vi_attr_classes`, and `vi_classes` were removed after the UX component migration. Use [UX components](../conventions/ux-components.md) (`cva` / [`vi_cva`](vi-cva.md) + `attributes`) instead.

## Implementation

| Extension class | File |
|-----------------|------|
| `Fyrst\ViewsTheme\Twig\ViIcon` | `src/Twig/ViIcon.php` |
| `Fyrst\ViewsTheme\Twig\ViUtilities` | `src/Twig/ViUtilities.php` |
| `Fyrst\ViewsTheme\Twig\ViCvaSlot` | `src/Twig/ViCvaSlot.php` |

## Conventions

- [UX components](../conventions/ux-components.md)
- [Component templates](../conventions/components.md)
