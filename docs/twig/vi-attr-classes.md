# `vi_attr_classes`

Twig filter. Converts a class list into a full HTML attribute: `class="a b"`.

```twig
<div {{ classes.main | vi_attr_classes }}></div>
```

## Behavior

- Filters empty / null / false values
- Deduplicates
- Empty input → empty string (no attribute)

Use this on HTML tags. For string APIs (form macros, attribute bags), use [`vi_classes`](vi-classes.md) instead.
