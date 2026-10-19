# Stepper

Generic ordered steps. No `data-component`.

Visual source: `Checkout/Stepper/Desktop` and `Checkout/Stepper/Mobile` in `views-theme.pen`. The pen’s Cart / Details / Delivery / Review row is an example only. Shopware has no stepper and no delivery step.

## Not mounted

`Stepper` is not rendered on confirm, cart, register, success, or edit-order. Confirm does not own it. This issue does not place it on any page.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Stepper` | `items` → one `Stepper:Item` per entry, step number = array index from 1, mobile track + desktop connectors |
| `Stepper:Item` | Mark (number or `vi_icon`) + label; link when `url` is set |

No PHP class. No JS.

## Composition

```
Stepper (nav)
├─ track (mobile only; hidden from xl)
└─ ol
   ├─ Stepper:Item
   ├─ line (desktop only)
   ├─ Stepper:Item
   └─ …
```

```twig
<twig:ViewsTheme:Stepper aria-label="Checkout" :items="[
    { label: 'Cart', url: path('frontend.checkout.cart.page') },
    { label: 'Review', active: true },
]" />
```

An `icon` replaces the number:

```twig
{ label: 'Cart', icon: 'cart', url: path('frontend.checkout.cart.page') }
```

## Props

### `Stepper`

| Prop | Default | Notes |
|------|---------|--------|
| `items` | `[]` | `list<{ label, url?, icon?, active? }>`. Empty list renders nothing |
| `cva` | `{}` | Deep-merge CVA overrides |

`Stepper` passes `loop.index` (from 1) into `Stepper:Item`.

`aria-label` is a root attribute, not a prop.

### `Stepper:Item`

| Prop | Default | Notes |
|------|---------|--------|
| `label` | `''` | Step text |
| `url` | `null` | When non-empty, the step is a link |
| `icon` | `null` | `vi_icon` name. When set, shown instead of the number |
| `active` | `false` | Current step (`aria-current="step"`) |
| `number` | `1` | Set by `Stepper`. Standalone callers may pass it |
| `cva` | `{}` | Deep-merge |

## Blocks / nests

| On | Blocks / nests |
|----|----------------|
| Stepper | `track`, `list`, `item`, `line` |
| Item | `content`, `mark`, `label`; nests `body`, `mark`, `label` |

## Layout

Desktop chrome starts at theme **`xl` (1260px)**. Below `xl` the mobile frame applies.

| | Below `xl` | `xl` |
|--|------------|------|
| Row | Equal columns, no gap | `gap-3` (12px), connectors between steps |
| Step | Column, gap 6px | Row, gap 8px (`--spacing-2`) |
| Mark | 22×22, radius 50% (pen radius 11) | same |
| Number | 11px, weight 600 | same |
| Label | 12px (`--icon-size-1`) | 14px (`--font-size-6`) |
| Inactive | Mark fill `--border-color` (linen), glyph and label `#66605D` (pen ash / theme `muted`), label weight 500 | same |
| Active | Mark fill `--dark`, glyph `--white`, label `--body-color`, label weight 600 | same |
| Connector | One track through the mark centers, 1px, top 10px | 1px rules between steps |

Inactive ash is `.text-muted` (theme `$muted`). The mark glyph and label stay on component tokens. 6px gap and 11px type have no utility, so they stay in component CSS. Breakpoint chrome that has a utility (`gap-xl-3`, `flex-xl-row`, `d-xl-none`, `d-xl-block`, `fw-medium` / `fw-semibold`) is CVA.

The mobile track runs from the center of the first mark to the center of the last (`--vi-stepper-count` on the track). Marks sit above it.

## Files

| Role | Path |
|------|------|
| Parent | `components/Stepper.{html.twig,cva.twig,css}` |
| Item | `components/Stepper/Item.{html.twig,cva.twig,css}` |
