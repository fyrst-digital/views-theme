# Twig extensions

ViewsTheme registers Twig helpers under the `vi_` prefix.

**New components** use Shopware UX (`{% props %}`, `cva()`, `attributes`) — see [UX components](../conventions/ux-components.md). The class-map helpers below are **legacy** until migration finishes.

| Name | Type | Purpose |
|------|------|---------|
| [`vi_define_classes`](vi-define-classes.md) | function | **Legacy** class map definer |
| [`vi_attr_classes`](vi-attr-classes.md) | filter | **Legacy** full `class="…"` attribute |
| [`vi_classes`](vi-classes.md) | filter | **Legacy** bare class string |
| [`vi_icon`](vi-icon.md) | function | Inline SVG or CSS icon markup |
| `vi_merge_deep` | filter | Deep array merge |

## Implementation

| Extension class | File |
|-----------------|------|
| `Fyrst\ViewsTheme\Twig\ViClasses` | `src/Twig/ViClasses.php` |
| `Fyrst\ViewsTheme\Twig\ViIcon` | `src/Twig/ViIcon.php` |
| `Fyrst\ViewsTheme\Twig\ViUtilities` | `src/Twig/ViUtilities.php` |

## Conventions

- [CSS class API](../conventions/css-classes.md)
- [Component templates](../conventions/components.md)
