# Twig extensions

ViewsTheme registers Twig helpers under the `vi_` prefix.

| Name | Type | Purpose |
|------|------|---------|
| [`vi_define_classes`](vi-define-classes.md) | function | Class map definer (defaults, variants, parent overrides) |
| [`vi_attr_classes`](vi-attr-classes.md) | filter | Full `class="…"` attribute |
| [`vi_classes`](vi-classes.md) | filter | Bare class string |
| [`vi_icon`](vi-icon.md) | function | Inline SVG or CSS icon markup |
| `vi_merge_deep` | filter | Deep array merge (prefer `vi_define_classes` for class maps) |

## Implementation

| Extension class | File |
|-----------------|------|
| `Fyrst\ViewsTheme\Twig\ViClasses` | `src/Twig/ViClasses.php` |
| `Fyrst\ViewsTheme\Twig\ViIcon` | `src/Twig/ViIcon.php` |
| `Fyrst\ViewsTheme\Twig\ViUtilities` | `src/Twig/ViUtilities.php` |

## Conventions

- [CSS class API](../conventions/css-classes.md)
- [Component templates](../conventions/components.md)
