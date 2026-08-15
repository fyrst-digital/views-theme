# `{% vi_block %}`

Forward a caller `<twig:block>` into a **nested** `<twig:…>` host (e.g. Grid). A `{% block foo %}` inside that host belongs to the inner component — callers of the outer one cannot fill it.

```twig
<twig:ViewsTheme:Grid columns="6" gap="3">
    <twig:block name="content">
        {% vi_block prepend %}{% endvi_block %}
        {% vi_block accountType %}
            {# default Toggle / Select / company #}
        {% endvi_block %}
        {% vi_block append %}{% endvi_block %}
    </twig:block>
</twig:ViewsTheme:Grid>
```

```twig
<twig:ViewsTheme:Address:Personal …>
    <twig:block name="accountType">…replaces the default…</twig:block>
    <twig:block name="append">…</twig:block>
</twig:ViewsTheme:Address:Personal>
```

## Behaviour

| Caller | Result |
|--------|--------|
| no block | tag body (default) |
| `<twig:block name="NAME">…</twig:block>` | override |
| empty `<twig:block name="NAME"></twig:block>` | hide |

No `{{ parent() }}` — an override replaces the chunk. Nest attrs stay for chrome (`accountTypeSelect:label`).

Do **not** use `{% set x %}{% block %}{% endset %}` + `<twig:block>` capture/forward.

Keep `{% block %}` when the slot sits on **plain HTML** in that same component (`Form:Input:Group` `append`).

Closer is `{% endvi_block %}` — not `{% endblock %}`. Symfony’s UX PreLexer treats `{% endblock %}` as the closer for `<twig:block>`.

## Implementation

`src/Twig/ViBlockTokenParser.php` + `ViBlockNode.php`, registered on `ViUtilities`. Compiles to Symfony `outerBlocks`: if the resolved name is not the empty fallback, `yieldBlock`; else the tag body.

## Related

- [Twig overview](overview.md)
- [UX components — nested slots](../conventions/ux-components.md#nested-slots-props-and-single-content-owner)
- [Checkout register](../features/checkout-register.md)
