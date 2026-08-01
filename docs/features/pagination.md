# Pagination

Theme-owned page navigation. Core includes `component/pagination.html.twig`; the theme bridge mounts UX `Pagination`. Used by `Product:Listing`, VariantsGrid, and any other core `pagination` include (orders, reviews).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/pagination.html.twig` — thin `sw_extends`; mounts `Pagination` |
| `Pagination` | Class-backed nav: page window math + gates; core ListingPagination-compatible markup |
| Core `ListingPagination` plugin | Stays on listing root `[data-listing-pagination]`; finds `.pagination .page-link` |

No co-located Pagination JS — listing XHR stays on core plugins.

## Wire-up

```twig
<twig:ViewsTheme:Pagination
    :entities="searchResult"
    location="top"
    searchQuery="{{ paginationSearchQuery }}"
/>

{# or explicit pages (VariantsGrid) #}
<twig:ViewsTheme:Pagination
    :currentPage="pagination.page"
    :totalPages="totalPages"
    pageParameter="variantsPage"
    location="variants-grid"
/>
```

## Core JS contract (critical)

| Selector / attr | Role |
|-----------------|------|
| `.pagination .page-link` | Click targets for `ListingPaginationPlugin` |
| `data-page` / `data-focus-id` | Page value + focus restore |
| `.pagination-nav` | Focus scope; `data-pagination-location` |
| Residual | `pagination`, `page-item`, `page-first/prev/next/last`, `active`, `disabled` |

Theme `vi-pagination*` classes sit **alongside** core classes.

## Props

### `Pagination` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `entities` | `null` | `EntitySearchResult` → derive `currentPage` / `totalPages` |
| `currentPage` / `totalPages` | from entities when null | Explicit wins |
| `location` | `null` | → `data-pagination-location` + `listing-pagination-{location}` |
| `href` | `true` | No-JS `?{pageParameter}=N` links; listing plugin `preventDefault`s |
| `pageParameter` | `p` | Query key (`variantsPage` for variants grid) |
| `searchQuery` | `''` | Suffix e.g. `&search=…` |
| `cva` | `{}` | `Pagination.cva.twig` |
| `visible` | derived | `totalPages > 1`; root omitted when false |
| `start` / `end` / `prevPage` / `nextPage` | derived | Core-style window |
| `isFirst` / `isLast` | derived | Disabled chrome |

### CVA slots

`root`, `list`, `item`, `link`, `first`, `prev`, `next`, `last`

### Blocks

`root`, `list`, `first`, `prev`, `pages`, `item`, `next`, `last`

## Behaviour notes

- Icons: `arrow-left` / `arrow-right` (first/last), `caret-left` / `caret-right` (prev/next)
- `pageHref(page)` public method builds query string
- Link attrs are hardcoded per item (not shared `vi_attrs('link')`) so loop values do not collide

## Files

| Role | Path |
|------|------|
| Bridge | `storefront/component/pagination.html.twig` |
| Component | `components/Pagination.{php,html.twig,cva.twig}` |
| Listing | [product-listing.md](product-listing.md) |
| Variants | `components/VariantsGrid/Pagination.html.twig` |
