# `vi_define_cva` / `vi_class`

Bind CVA config and resolve applied class strings. **No** `{% set cx %}` — use `{% do %}` + `vi_class`.

Implemented in `src/Twig/ViUtilities.php` / `src/Twig/ViCvaSlot.php`. Uses [`Twig\Extra\Html\Cva`](https://twig.symfony.com/html_cva).

Nest attribute bags stay separate: [`vi_define_attrs` / `vi_attrs`](vi-attrs.md).

## Signatures

```twig
{% do vi_define_cva(cva) %}
{% do vi_define_cva(cva, ['root', 'toggle', 'label']) %}
{% do vi_define_cva({ root: { base: '…' } }) %}
{% do vi_define_cva(cva, { file: 'Alert', classes: ['root'] }) %}

{{ vi_class('root') }}
{{ vi_class('root', { size: size, color: color }) }}
```

| Call | Role |
|------|------|
| `vi_define_cva(…)` | Load/bind CVA, strip `slot:class`, export slots for `vi_class` (returns `''`) |
| `vi_class('slot')` | Exported slot → `apply()` |
| `vi_class('slot', { … })` | → `apply(variants)` |

Aliases `vi_cva` / `vi_cva_from_file` call `vi_define_cva` (prefer the new name).

## Config source (1st arg)

1. Sibling `Name.cva.twig` when present → load, deep-merge 1st arg as **overrides** (`cva` prop).
2. Else 1st arg is a **full inline** slot config map (small components).
3. Optional explicit file via 2nd-arg options `{ file: 'Alert' }` or string path.

## Class export (2nd arg)

| 2nd arg | Behavior |
|---------|----------|
| omitted | Export **all** slots |
| `['root', 'toggle']` | Export only those names (safer across nested hosts) |
| `{ classes: […], file?: '…' }` | Options bag |

Exported slots are stored on the UX **component stack** (and context fallback). `vi_class` walks **current → parents** (nearest wins).

**Same-name rule:** if parent and child both export `toggle`, the nearer frame wins. Export only slots needed for nested `<twig:block>` use when names collide with a host (e.g. `Dropdown`).

**Export list must cover every `vi_class('slot')` in the template.** A narrow list that omits `root` / layout slots yields empty class strings and broken layout. Prefer omit the list (export all) unless you need clash control.

## Variants

Always at the **use site**:

```twig
{% do vi_define_cva(cva, ['root', 'link']) %}
class="{{ vi_class('link', { level: level, active: isActive }) }}"
```

Do **not** bake variants into `vi_define_cva`.

## Example

```twig
{% props cva = {} %}
{% do vi_define_cva(cva, ['root', 'field', 'submit']) %}
{% do vi_define_attrs(['field', 'submit']) %}

<form {{ attributes.defaults({…}) }} class="{{ vi_class('root') }}">
    <twig:ViewsTheme:Form:Input:Group
        class="{{ vi_class('field') }}"
        {{ ...vi_attrs('field').defaults({…}).all() }}
    >
        <twig:block name="append">
            <twig:ViewsTheme:Button
                class="{{ vi_class('submit') }}"
                {{ ...vi_attrs('submit').defaults({ type: 'submit' }).all() }}
            />
        </twig:block>
    </twig:ViewsTheme:Form:Input:Group>
</form>
```

## `.cva.twig` format

Single Twig **hash expression** (optional `{# comments #}`). Evaluated with component context:

```twig
{
    root: {
        base: 'vi-box layout-' ~ layout,
        variants: {
            size: { sm: '…' },
        },
    },
    content: { base: 'vi-box__content' },
}
```

## Related

- [vi-attrs](vi-attrs.md) — nest bags
- [UX components](../conventions/ux-components.md)
- [CSS class API](../conventions/css-classes.md)
