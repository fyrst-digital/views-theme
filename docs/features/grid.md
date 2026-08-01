# Grid

Generic CSS grid layout shell. Owns container chrome (`grid`) plus optional **gap** / **columns** CSS tokens. Children own their own spans (`g-col-*` or auto placement).

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

{# Or set track count via token #}
<twig:ViewsTheme:Grid columns="4" gap="1rem">
    …
</twig:ViewsTheme:Grid>
```

## Props

| Prop | Default | Notes |
|------|---------|--------|
| `role` | `null` | Root ARIA role |
| `gap` | `null` | `'0'`…`'5'` → Bootstrap `gap-*`; other string → `--vi-grid-gap` |
| `columns` | `null` | Scalar only → `--vi-grid-cols: N` (no breakpoint maps) |
| `cva` | `{}` | Root override |

## Tokens (CSS only consumes)

```css
.vi-grid[data-grid-gap-mode='token'] {
  gap: var(--vi-grid-gap, var(--bs-gap, 0));
}
.vi-grid {
  grid-template-columns: repeat(var(--vi-grid-cols, 12), minmax(0, 1fr));
}
.vi-grid > [data-grid-span='full'] {
  grid-column: 1 / -1;
}
```

Theme may assign `--vi-grid-cols` / `--vi-grid-gap` on a host without props. **No media queries in Grid.css.**

## Blocks

| Block | Default |
|-------|---------|
| `content` | Empty |

## Consumers

| Caller | Notes |
|--------|--------|
| `Product:Listing:Results` | Items grid; density via Results `size` → item CVA `g-col-*` |

## Files

`components/Grid.{html.twig,cva.twig,css}`
