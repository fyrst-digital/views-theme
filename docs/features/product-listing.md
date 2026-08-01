# Product listing

Theme-owned product grid: owner JS, Results island, Pagination, Sorting, Filters. Core `ListingPlugin` / filter plugins are **not** used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/product/listing.html.twig` → `Product:Listing` + theme `/vi/listing/…` URLs |
| `Product:Listing` | Class VM + **owner JS**: fetch, history, control registry, island swap |
| `Product:Listing:Results` | XHR-swappable island (actions, items, empty, pagination) |
| `Pagination` / `Sorting` | Theme chrome + controls registered with Listing |
| Filters | [filters.md](filters.md) |
| Controllers | `ListingController` — results HTML + aggregations JSON |

## Composition

```
Product:Listing (data-component owner)
  └─ Product:Listing:Results (island)
       ├─ actions → Pagination + Sorting
       ├─ items → Product:Box × N | empty
       └─ Pagination bottom
```

Sidebar (sibling): `Filter:Panel` → registers controls on Listing via `callMethod`.

## Controllers

| Route | Path | Response |
|-------|------|----------|
| `frontend.views-theme.listing.category` | `/vi/listing/category/{navigationId}` | HTML `Product:Listing:Results` |
| `frontend.views-theme.listing.category.aggregations` | `…/aggregations` | JSON aggregations |
| `frontend.views-theme.listing.search` | `/vi/listing/search` | HTML Results |
| `frontend.views-theme.listing.search.aggregations` | `…/aggregations` | JSON |

Loaders: `AbstractProductListingRoute` / `AbstractProductSearchRoute`. Render via `AbstractComponentController::renderComponent()`.

## Owner JS (`Listing.js`)

| API | Role |
|-----|------|
| `refreshControls()` | Discover controls in listing el + every `Filter:Panel` |
| `apply(patch, { pushHistory, resetPage })` | Merge values → fetch Results → optional aggs |
| `reset` / `resetAll` | Delegate to controls then apply |
| `getActiveLabels()` | For `Filter:Active` chips |
| History keys | From control `getParamKeys()` + `baseParams` (not a hard-coded facet list) |

Events: `ViewsTheme:Listing:Changed`, `ViewsTheme:Listing:Loading`.

Options (Twig `data-component-options`): `resultsUrl`, `aggregationsUrl`, `baseParams`, `display` (`boxLayout`, `listingColumns`, `referrerCategoryId`), `disableEmptyFilter`, `history`.

## Props (`Product:Listing`)

| Prop | Notes |
|------|--------|
| `searchResult` | Initial SSR result |
| `resultsUrl` / `aggregationsUrl` | Theme routes (bridge resolves category/search) |
| `params` | Always-merged query (e.g. `{ search }`) |
| `boxLayout` / `listingColumns` / `referrerCategoryId` | Forwarded to Results / Box |
| `disableEmptyFilter` | Config default; enables aggregations refresh |

## Blocks

| On | Blocks |
|----|--------|
| Listing | `results` |
| Results | `actions`, `paginationTop`, `sorting`, `items`, `item`, `box`, `empty`, `emptyAlert`, `paginationBottom` |

## Known gaps

- Wishlist listing XHR route not added yet
- Bootstrap `listingColumns` still drive the grid
- Human must rebuild storefront JS after pull

## Files

| Role | Path |
|------|------|
| Bridge | `storefront/component/product/listing.html.twig` |
| Listing | `components/Product/Listing.{php,html.twig,cva.twig,js}` |
| Results | `components/Product/Listing/Results.{php,html.twig,cva.twig,js}` |
| Controller | `src/Controller/ListingController.php` |
| Pagination / Sorting | `components/Pagination.*`, `components/Sorting.*` |
| Filters | [filters.md](filters.md) |
