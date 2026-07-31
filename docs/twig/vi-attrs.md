# `vi_define_attrs` / `vi_attrs`

Stack-scoped bind + resolve for nest **attribute bags**. **Do not** `{% set attrs %}`.

CVA / classes: [`vi_define_cva` / `vi_class`](vi-cva.md) (separate API).

```twig
{% do vi_define_cva(cva, ['root', 'field', 'submit']) %}
{% do vi_define_attrs(['field', 'submit']) %}

{{ ...vi_attrs('field').defaults({ name: 'code', … }).all() }}

<twig:block name="append">
    {{ ...vi_attrs('submit').defaults({ type: 'submit', … }).all() }}
</twig:block>
```

## Why

Nested hosts run `<twig:block>` overrides in the **child** context. A parent `{% set attrs %}` is shadowed when the child sets `attrs`.

`vi_define_attrs` stores bags on the UX **component stack** (+ context fallback). `vi_attrs` walks **current → parents** (nearest slot wins).

## API

| Call | Role |
|------|------|
| `{% do vi_define_attrs(['field', 'submit']) %}` | After `vi_define_cva`. Each name → `attributes.nested(name)`. |
| `vi_attrs('submit')` | `ComponentAttributes` bag (empty if missing). |

Defaults stay **inline** at the use site: `vi_attrs('slot').defaults({…})`.

**Every `vi_attrs('slot')` must appear in `vi_define_attrs([…])`.** Without define, the bag is empty and parent nest overrides (`button:label`, …) never merge.

Own root stays on `attributes` / `attributes.defaults` — not via define.

## Order

1. `{% do vi_define_cva(…) %}`
2. `{% do vi_define_attrs(…) %}` when using nests
3. Render with `vi_class` / `vi_attrs`

## Related

- [vi-cva](vi-cva.md)
- [UX components — nested blocks](../conventions/ux-components.md#nested-blocks-parent-locals-are-shadowed)
- [Twig overview](overview.md)
