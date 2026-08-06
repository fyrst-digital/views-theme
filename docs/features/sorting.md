# Sorting

Theme-owned sort control. Composes `Form:Select`. Registers with `Product:Listing` when present.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/sorting.html.twig` → `Sorting` |
| `Sorting` | Class VM (options map) + `Sorting.js` → `{ order }` |
| `Product:Listing` | Applies `order` + resets page |

No core `ListingSorting` / `data-listing-sorting`.

## Props

| Prop | Notes |
|------|--------|
| `current` | Active key |
| `sortings` | Collection / iterable |
| `show` | Visibility gate |

## Files

`components/Sorting.{php,html.twig,cva.twig,js}` · bridge `storefront/component/sorting.html.twig`
