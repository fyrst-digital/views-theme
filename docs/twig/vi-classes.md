# `vi_classes`

Twig filter. Converts a class list into a bare class string (no attribute wrapper). Use when a Shopware API expects a string.

```twig
{# Form field macros #}
additionalClass: classes.email | vi_classes,

{# Media / thumbnail attribute bags #}
attributes: {
  class: classes.image | vi_classes,
}
```

Do **not** use `|join(' ')` for class maps.

For HTML tags, prefer [`vi_attr_classes`](vi-attr-classes.md).
