# Sorting

Theme-owned listing sort control. Core includes `component/sorting.html.twig`; the theme bridge mounts UX `Sorting`. Used by `Product:Listing` and any other core sorting include.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/sorting.html.twig` — full path replace; mounts `Sorting` |
| `Sorting` | Class-backed shell: sortings → options; `data-listing-sorting` + `Form:Select` |
| Core `ListingSorting` plugin | On `[data-listing-sorting]`; reads descendant `<select>` |

No co-located Sorting JS.

## Wire-up

```twig
<twig:ViewsTheme:Sorting
    :current="searchResult.sorting"
    :sortings="searchResult.availableSortings"
/>
```

CMS may pass `show` from `slot.config.showSorting` (bridge default `true`).

## Core JS contract (critical)

| Selector / attr | Role |
|-----------------|------|
| Root `data-listing-sorting` | Plugin host |
| `data-listing-sorting-options` | JSON `{ sorting: currentKey }` |
| Descendant `<select>` | Change → `order` query param |
| Residual class `sorting` | Core CSS hook |

After listing XHR, core `afterContentChange` deregisters the old instance; `initializePlugins` binds the new markup.

## Props

### `Sorting` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `current` | `null` | Active sorting key |
| `sortings` | `[]` | `ProductSortingCollection` / iterable |
| `show` | `true` | Visibility gate (CMS) |
| `cva` | `{}` | `Sorting.cva.twig` |
| `options` | derived | `[{ value, label }]` for `Form:Select` |
| `visible` | derived | `show` ∧ options not empty; root omitted when false |

### CVA slots

`root`, `select`

### Blocks

`select` — overridable `Form:Select` mount

## Composition

```
Sorting
  └─ Form:Select (no label; select:aria-label = general.sortingLabel)
```

Nest overrides: `select:…` / `select:select:…` (Form:Select nest).

## Files

| Role | Path |
|------|------|
| Bridge | `storefront/component/sorting.html.twig` |
| Component | `components/Sorting.{php,html.twig,cva.twig}` |
| Select | `components/Form/Select.*` — [form-input.md](form-input.md) |
| Listing | [product-listing.md](product-listing.md) |
