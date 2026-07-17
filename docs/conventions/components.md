# Component template conventions

Every component under `src/Resources/views/components/` that renders styled markup must:

1. Define defaults with `vi_define_classes`
2. Output map keys with `{{ classes.key | vi_attr_classes }}` on HTML tags
3. Use `{{ classes.key | vi_classes }}` only for string APIs (forms, attribute bags)
4. Prefer **variants** / `replaceClasses: ['slot']` over post-define `|merge` hacks
5. Prefer `vi_define_classes(base, override)` over `vi_merge_deep` when composing class maps for child includes
6. Hook interactive roots with `data-component="…"` (see [JavaScript](javascript.md))

## Status table

| Pattern | Status |
|---------|--------|
| `vi_attr_classes` on HTML tags | Required |
| `vi_classes` for string slots | Required (do not use `\|join(' ')`) |
| `replaceClasses: ['key']` | Fully set those slots; all other keys merge |
| Runtime list merge via `vi_define_classes` | OK for per-iteration state |
| `icon/icon.html.twig` | Exempt (own dynamic icon API) |
| Shell / router templates | Exempt |

> **Shopware 6.8:** a future track may adopt UX Twig components + CVA. Until then this API is the ViewsTheme standard.

## Related

- [CSS class API](css-classes.md)
- [Twig overview](../twig/overview.md)
