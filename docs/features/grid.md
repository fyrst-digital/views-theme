# Grid

Generic CSS grid layout shell. Owns container chrome (`d-grid grid`) plus a **columns** density and an optional **gap** token. Children own their own spans (`g-col-*`). `.g-col-*` is generated under `.grid`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Grid` | `d-grid grid` (`.grid` is the `.g-col-*` parent); `columns` density → responsive `grid-columns-*`; `css-gap` → `--vi-grid-gap` |
| Caller | Content; item column classes when needed |

No PHP/JS / `data-component`.

## Usage

```twig
{# Default md — one column, two from md #}
<twig:ViewsTheme:Grid role="list" gap="md">
    <twig:block name="content">
        {% for product in products %}
            <twig:ViewsTheme:Product:Box :product="product" />
        {% endfor %}
    </twig:block>
</twig:ViewsTheme:Grid>

{# Field canvas — one column, six from md. Full g-col-1 g-col-md-6, half g-col-md-3, third g-col-md-2 #}
<twig:ViewsTheme:Grid columns="lg" gap="sm">
    …
</twig:ViewsTheme:Grid>

{# Token gap — CVA `css-gap` #}
<twig:ViewsTheme:Grid :gap="false">
    …
</twig:ViewsTheme:Grid>

{# Custom tracks on the host — omit the utility (`!important`) #}
<twig:ViewsTheme:Grid columns="custom" gap="md">
    …
</twig:ViewsTheme:Grid>
```

## Props

| Prop | Default | Notes |
|------|---------|--------|
| `role` | `null` | Root ARIA role |
| `gap` | `false` | `false` → `css-gap` (`gap: var(--vi-grid-gap, …)`); `'sm'` / `'md'` / `'lg'` → `gap-2` / `gap-4` / `gap-6` |
| `columns` | `null` | `null` → `md`. Densities: `xs` `grid-columns-2 grid-columns-md-4 grid-columns-xl-6`; `sm` `grid-columns-1 grid-columns-sm-3`; `md` `grid-columns-1 grid-columns-md-2`; `lg` `grid-columns-1 grid-columns-md-6`; `xl` `grid-columns-1 grid-columns-xl-6`; `xxl` `grid-columns-1 grid-columns-lg-8`. `custom` omits the utility so the host owns the tracks |
| `cva` | `{}` | Root override |

## Tokens (CSS only consumes)

```css
.vi-grid {
  &.css-gap {
    gap: var(--vi-grid-gap, var(--spacing-0, 0));
  }
}
```

Column count is a `columns` density of `grid-columns-*` utilities: `repeat(N, minmax(0, 1fr))`. They are `!important`, so a host cannot override them with a custom property. Spans (`g-col-*`) must match the track count at that breakpoint.

| Token | Role |
|-------|------|
| `--vi-grid-gap` | Token path when `gap` is `false` (`css-gap`). Named sizes use Bootstrap `gap-*` instead |

Theme may assign `--vi-grid-gap` on a host without props. **No media queries in Grid.css.** Custom tracks (listing auto-fill, review panel/matrix) live in that component’s CSS. A `Grid` host that needs them passes `columns: 'custom'`.

Field canvas (`columns="lg"`): below `md` one column; from `md` six tracks. Full = `g-col-1 g-col-md-6`, half = `g-col-1 g-col-md-3`, third = `g-col-1 g-col-md-2`. Listing empty (auto-fill tracks) sets `grid-column: 1 / -1` on `Product:Listing:Empty` — not on Grid.

## Blocks

| Block | Default |
|-------|---------|
| `content` | Empty |

Nested `<twig:…>` children **must** sit in `<twig:block name="content">`. Without it, Shopware compiles those tags as raw HTML and `{{ ...vi_attrs().all() }}` fatals (`Cannot use positional argument after argument unpacking`).

## Consumers

| Caller | Notes |
|--------|--------|
| `Product:Listing:Results` | Items grid (`gap="md"`; `size=md` adds `gap-md-8`); `columns: 'custom'`; auto-fill tracks in `Results.css` (`--vi-product-basis`) |
| `Account:Register` / `Address:*` | Field canvas `columns="lg"` (one column, six from `md`) |
| `Address:List` | Shipping + billing cards (`columns="md"`; each card is one track) |
| `Page:Footer:Main` | Outer columns Grid (`columns="xxl"`, `gap: false` / `--vi-grid-gap`). From `lg`: Hotline `g-col-lg-3`, Navigation `g-col-lg-5`, Logos `g-col-lg-8` |

## Files

`components/Grid.{html.twig,cva.twig,css}`
