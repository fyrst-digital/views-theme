# Stepper

Generic ordered steps. No `data-component`.

Visual source: `Checkout/Stepper/Desktop` and `Checkout/Stepper/Mobile` in `views-theme.pen`. Shopware has no delivery step. The component is not mounted on a page.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Stepper` | `items` → one `Stepper:Item` per entry, step number = array index from 1. Each item except the last draws the connector with `::after` |
| `Stepper:Item` | Mark (number or `vi_icon`) + label; link when `url` is set |

No PHP class. No JS.

## Composition

```
Stepper (nav)
└─ ol
   ├─ Stepper:Item
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
| Stepper | `list`, `item` |
| Item | `content`, `mark`, `label`; nests `body`, `mark`, `label` |

## Layout

Desktop chrome starts at theme **`xl` (1260px)**. Below `xl` the mobile frame applies.

| | Below `xl` | `xl` |
|--|------------|------|
| Row | Equal columns, no gap | `gap-3` (12px), connectors between steps |
| Step | Column, `gap-2` (8px) | Row, `gap-2` (8px) |
| Mark | 24×24 (`--vi-stepper-size`), radius 50% | same |
| Number | `fs-6` (14px), weight 600 (`fw-semibold`) | same |
| Icon | `icon-size-2` (16px) | same |
| Label | `fs-6` (14px) | `fs-6` (14px) |
| Inactive | Mark `bg-light text-muted`, label `fw-medium text-muted` | same |
| Active | Mark `bg-dark text-white`, label `text-body fw-semibold` | same |
| Connector | `::after` through the mark centers | `::after` grows between steps (`gap-xl-3` on each side) |

Inactive mark fill is `bg-light`, the stand-in until a utility exists for `--border-color`. Inactive ash is `text-muted` (theme `$muted`). The active mark is `bg-dark text-white`. The active label is `text-body`. `text-muted` and `bg-light` are only on the inactive variant, so they are not on the element together with `text-white` and `bg-dark`. A linked step uses `text-decoration-none text-decoration-none-hover`, so the hover underline from `a:hover` stays off. The step gap is `gap-2` (8px) at every width. The label is `fs-6` (14px) at every width. The pen’s 6px gap and 12px label have no utility, so those nearest classes are used.

The 24px mark has no utility, so it stays in component CSS. The connector is one `::after` on each item except the last, nested on `.vi-stepper__item`. The centered connector is the base rule in `_theme.scss`: it starts at the mark center and is one column wide, so it meets the next mark. From `xl`, `media-breakpoint-up(xl)` resets that pseudo to `position: static`, `inline-size: auto`, and `flex-grow: 1`, and the last item to `flex-grow: 0`. The list `gap-xl-3` is the space after the rule. The item `gap-xl-3` is the space before it. `flex-basis` is `var(--vi-stepper-basis, 0)` in component CSS. From `xl`, the same block assigns `--vi-stepper-basis: auto`. The number is `fs-6`. The icon is `icon-size-2`. Breakpoint chrome that has a utility (`gap-2`, `gap-xl-3`, `fs-6`, `flex-xl-row`, `fw-medium` / `fw-semibold`, `bg-light` / `bg-dark`) is CVA.

Marks sit above the line (`z-1`).

## Files

| Role | Path |
|------|------|
| Parent | `components/Stepper.{html.twig,cva.twig}` |
| Item | `components/Stepper/Item.{html.twig,cva.twig,css}` |
| Connector / basis | `scss/_theme.scss` (`.vi-stepper__item`) |
