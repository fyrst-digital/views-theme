# Grid

Generic CSS grid layout shell. Owns container chrome (`d-grid grid`) plus a **columns** track recipe and an optional **gap** token. Children own their own spans (`g-col-*`). `.g-col-*` is generated under `.grid`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Grid` | `d-grid grid` (`.grid` is the `.g-col-*` parent); `columns` recipe → responsive `grid-columns-*`; `css-gap` → `--vi-grid-gap` |
| Caller | Content; item column classes when needed |

No PHP/JS / `data-component`.

## Usage

```twig
{# Default 1-md:2 — one column, two from md #}
<twig:ViewsTheme:Grid role="list" gap="md">
    <twig:block name="content">
        {% for product in products %}
            <twig:ViewsTheme:Product:Box :product="product" />
        {% endfor %}
    </twig:block>
</twig:ViewsTheme:Grid>

{# Field canvas — one column, six from md. Full g-col-1 g-col-md-6, half g-col-md-3, third g-col-md-2 #}
<twig:ViewsTheme:Grid columns="1-md:6" gap="sm">
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
| `role` | `null` | Root ARIA role (omitted when empty) |
| `gap` | `false` | `false` → `css-gap` (`gap: var(--vi-grid-gap, …)`); `'sm'` / `'md'` / `'lg'` → `gap-2` / `gap-4` / `gap-6`; `'custom'` omits the utility so the host owns `gap` (e.g. `Cms:Section:*` via `--vi-cms-section-gap`) |
| `columns` | `null` | `null` → `1-md:2`. Grammar: base count, then `-{breakpoint}:{count}` steps in breakpoint order (`1-sm:3-xl:6` = 1, then 3 from `sm`, 6 from `xl`). Presets: `1` `grid-columns-1`; `1-sm:3` `grid-columns-1 grid-columns-sm-3`; `1-md:2` `grid-columns-1 grid-columns-md-2`; `1-md:6` `grid-columns-1 grid-columns-md-6`; `1-md:12` `grid-columns-1 grid-columns-md-12`; `1-md:12-lg:1` `grid-columns-1 grid-columns-md-12 grid-columns-lg-1`; `1-xl:6` `grid-columns-1 grid-columns-xl-6`; `1-lg:8` `grid-columns-1 grid-columns-lg-8`; `1-lg:12` `grid-columns-1 grid-columns-lg-12`. `custom` omits the utility so the host owns the tracks |
| `cva` | `{}` | Root override |

## Tokens (CSS only consumes)

```css
.vi-grid {
  &.css-gap {
    gap: var(--vi-grid-gap, var(--spacing-0, 0));
  }
}
```

Column count is a `columns` recipe of `grid-columns-*` utilities: `repeat(N, minmax(0, 1fr))`. They are `!important`, so a host cannot override them with a custom property. Spans (`g-col-*`) must match the track count at that breakpoint.

| Token | Role |
|-------|------|
| `--vi-grid-gap` | Token path when `gap` is `false` (`css-gap`). Named sizes use Bootstrap `gap-*` instead |

Theme may assign `--vi-grid-gap` on a host without props. **No media queries in Grid.css.** Custom tracks (listing auto-fill, review panel/matrix) live in that component’s CSS. A `Grid` host that needs them passes `columns: 'custom'`; a host that owns its gap passes `gap: 'custom'`.

Field canvas (`columns="1-md:6"`): below `md` one column; from `md` six tracks. Full = `g-col-1 g-col-md-6`, half = `g-col-1 g-col-md-3`, third = `g-col-1 g-col-md-2`. Listing empty (auto-fill tracks) sets `grid-column: 1 / -1` on `Product:Listing:Empty` — not on Grid.

## Blocks

| Block | Default |
|-------|---------|
| `content` | Empty |

Nested `<twig:…>` children **must** sit in `<twig:block name="content">`. Without it, Shopware compiles those tags as raw HTML and `{{ ...vi_attrs().all() }}` fatals (`Cannot use positional argument after argument unpacking`).

## Consumers

| Caller | Notes |
|--------|--------|
| `Product:Listing:Results` | Items grid (`gap="md"`; `size=md` adds `gap-md-8`); `columns: 'custom'`; auto-fill tracks in `Results.css` (`--vi-product-basis`) |
| `Account:Register` / `Address:*` | Field canvas `columns="1-md:6"` (one column, six from `md`) |
| `Address:List` | Shipping + billing cards (`columns="1-md:2"`; each card is one track) |
| `Cms:Sections` / `Cms:Section:Default` / `Cms:Section:Sidebar` / `Cms:Block` | Page, section and block layout (`columns` `1`, `1-lg:12`, `1-md:12`, `1-md:12-lg:1`); columns span with `g-col-*` — [cms.md](cms.md) |
| `Cms:Section:Default` / `Cms:Section:Sidebar` | `gap: 'custom'`; `Section.css` reads `--vi-cms-section-gap` — [cms.md](cms.md#section-layout-settings) |
| `Page:Footer:Main` | Outer columns Grid (`columns="1-lg:8"`, `gap: false` / `--vi-grid-gap`). From `lg`: Hotline `g-col-lg-3`, Navigation `g-col-lg-5`, Logos `g-col-lg-8` |

## Files

`components/Grid.{html.twig,cva.twig,css}`
