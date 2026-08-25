# Grid

Generic CSS grid layout shell. Owns container chrome (`grid`) plus optional **gap** / **columns** CSS tokens. Children own their own spans (`g-col-*`).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Grid` | `display: grid`; optional `--vi-grid-gap` / `--vi-grid-cols` |
| Caller | Content; item column classes when needed |

No PHP/JS / `data-component`.

## Usage

```twig
{# Default 12-col BS grid; items use g-col-* #}
<twig:ViewsTheme:Grid role="list" gap="4">
    <twig:block name="content">
        {% for product in products %}
            <twig:ViewsTheme:Product:Box class="g-col-6 g-col-lg-4" :product="product" />
        {% endfor %}
    </twig:block>
</twig:ViewsTheme:Grid>

{# Address / register fields — 6-col base #}
<twig:ViewsTheme:Grid columns="6" gap="3">
    …
</twig:ViewsTheme:Grid>
```

## Props

| Prop | Default | Notes |
|------|---------|--------|
| `role` | `null` | Root ARIA role |
| `gap` | `null` | `'0'`…`'10'` → Bootstrap `gap-*`; other string → `--vi-grid-gap` + `data-grid-gap-mode="token"` |
| `columns` | `null` | Scalar only → `--vi-grid-cols: N` (no breakpoint maps) |
| `cva` | `{}` | Root override |

## Tokens (CSS only consumes)

```css
.vi-grid {
  grid-template-columns: var(--vi-grid-columns, repeat(var(--vi-grid-cols, 12), minmax(0, 1fr)));

  &[data-grid-gap-mode='token'] {
    gap: var(--vi-grid-gap, var(--bs-gap, 0));
  }
}
```

| Token | Role |
|-------|------|
| `--vi-grid-cols` | Track **count** (from `columns` prop; default `12`) |
| `--vi-grid-gap` | Token gap when `gap` is not `0`–`5` |
| `--vi-grid-columns` | Optional **full** `grid-template-columns` override (listing auto-fill, Review panel/matrix) |

Theme may assign `--vi-grid-cols` / `--vi-grid-gap` / `--vi-grid-columns` on a host without props. **No media queries in Grid.css.**

Address/register fields: parent `columns="6"`; full = `g-col-6`, pair = `g-col-3`, third = `g-col-2`. Listing empty (auto-fill tracks) sets `grid-column: 1 / -1` on `Product:Listing:Empty` — not on Grid.

## Blocks

| Block | Default |
|-------|---------|
| `content` | Empty |

Nested `<twig:…>` children **must** sit in `<twig:block name="content">`. Without it, Shopware compiles those tags as raw HTML and `{{ ...vi_attrs().all() }}` fatals (`Cannot use positional argument after argument unpacking`).

## Consumers

| Caller | Notes |
|--------|--------|
| `Product:Listing:Results` | Items grid; density via Results `size` → item CVA `g-col-*`; host may set `--vi-grid-columns` |
| `Account:Register` / `Address:*` | Field layout, 6-col base |

## Files

`components/Grid.{html.twig,cva.twig,css}`
