# Product listing

Theme-owned product grid: owner JS, Results island, Pagination, Sorting, Filters. Core `ListingPlugin` / filter plugins are **not** used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/product/listing.html.twig` → `Product:Listing` + theme `/vi/listing/…` URLs |
| `Product:Listing` | Class VM + **owner JS**: fetch, history, control registry, island swap |
| `Product:Listing:Results` | XHR-swappable island (actions, items, empty, pagination) |
| `Product:Listing:Actions` | Top bar: Pagination + Sorting |
| `Product:Listing:Empty` | Empty results shell (default Alert; overridable `content`) |
| `Grid` | Items container (CSS grid shell) — [grid.md](grid.md) |
| `Pagination` / `Sorting` | Theme chrome + controls registered with Listing; Pagination hrefs preserve listing query (`preserveQuery`) — [pagination.md](pagination.md) |
| Filters | [filters.md](filters.md) |
| Controllers | `ListingController` via `ProductListingGateway` — results HTML, aggregations JSON, filter-options JSON |

## Composition

```
Product:Listing (data-component owner)
  └─ Product:Listing:Results (island)
       ├─ Product:Listing:Actions → Pagination + Sorting
       ├─ Grid
       │    ├─ Product:Box × N
       │    └─ or Product:Listing:Empty (own CSS `grid-column: 1 / -1`)
       └─ Pagination bottom
```

Item density: Results prop `size` (`sm` | `md` | `lg`, default `md`) → CVA `g-col-*` on each Box. Results-only (not on Listing / XHR display).

Sidebar (sibling): desktop `Filter:Panel` + mobile `Filter:Drawer:Action` — see [filters.md](filters.md). Listing discovers controls under every live Panel (URL is filter SoT).

## Controllers

| Route | Path | Response |
|-------|------|----------|
| `frontend.views-theme.listing.category` | `/vi/listing/category/{navigationId}` | HTML `Product:Listing:Results` |
| `frontend.views-theme.listing.category.aggregations` | `…/aggregations` | JSON aggregations |
| `frontend.views-theme.listing.category.filter-options` | `…/filter-options` | JSON `{ options, meta }` |
| `frontend.views-theme.listing.search` | `/vi/listing/search` | HTML Results |
| `frontend.views-theme.listing.search.aggregations` | `…/aggregations` | JSON |
| `frontend.views-theme.listing.search.filter-options` | `…/filter-options` | JSON `{ options, meta }` |
| `frontend.views-theme.filter.drawer.category` | `/vi/filter/drawer/category/{navigationId}` | HTML `Filter:Drawer` |
| `frontend.views-theme.filter.drawer.search` | `/vi/filter/drawer/search` | HTML `Filter:Drawer` |

Loaders: `ProductListingGateway` → core listing/search routes. Results XHR sets `no-aggregations`. Render via `AbstractComponentController` + `ComponentHtmlRenderer`. Filter-options payload + drawer: [filters.md](filters.md).

## Owner JS (`Listing.js`)

Orchestrator only. Domain modules under `app/storefront/src/modules/listing/` — import via `@views-theme/modules/listing/…` only (plus `shared/*` for pure helpers):

| Module | Role |
|--------|------|
| `params.js` | Request param merge (`\|` multi), history keys, URL parse; re-exports `objectOption` / `collectControlValues` from `shared/object-option` |
| `history.js` | Thin wrapper → `shared/history` (scalar `set`, skip display keys) |
| `controls.js` | Control registry (discover / prune / panels / hydrate / labels) |
| `fetch.js` | Results HTML + filter-options + aggregations XHR (abort/seq) |
| `filter-options.js` | Apply options payload / availability onto controls |
| `results-dom.js` | Results island swap, wait Pagination/Sorting mount, scroll, aria-live |
| `apply.js` | Façade for controls: `applyListing` / `syncListingControls` / `resetListing` |

Domain stays isolated from `review/*` — [javascript.md](../conventions/javascript.md).

| API | Role |
|-----|------|
| `refreshControls()` | Discover controls in listing el + active `Filter:Panel` |
| `hydrateFromUrl()` | `setFromUrl` on every registered control from `location.search` |
| `syncControls()` | `refreshControls` + `hydrateFromUrl` + emit `ControlsSynced` (selection only) |
| `syncFilterOptions(params?, { built })` | Batch option HTML + meta (preferred); falls back to `syncAvailability`; abort + seq guard |
| `syncAvailability(params?, { built })` | Reduced aggs JSON → `applyAvailability` (fallback); same options abort/seq |
| `apply(patch, { pushHistory, resetPage })` | Results ∥ filter-options → after Results swap, await Pagination/Sorting mount, `refreshControls`, push history, hydrate controls from **request params** (not stale URL), then options; options abort does not fail Results apply |
| `reset` / `resetAll` | Delegate to controls then apply |
| `getActiveLabels()` | For `Filter:Active` chips (de-duped by id) |
| History keys | From control `getParamKeys()` + `baseParams` (not a hard-coded facet list) |
| Active panels | Drawer open via `Drawer.isOpen()` on `#vi-filter-drawer` — never CSS classes |

Controls (filters, pagination, sorting) call Listing only via `@views-theme/modules/listing/apply.js` façades (`applyListing`, `syncListingControls`, `resetListing`) — not raw `callMethod(…, 'apply')` and not other `listing/*` internals.

Events: `ViewsTheme:Listing:Changed`, `ViewsTheme:Listing:ControlsSynced`, `ViewsTheme:Listing:AvailabilitySynced`, `ViewsTheme:Listing:Loading`.

**Catalog vs availability:** Panel SSR = full catalog + SSR availability mark. Live updates = batch `/filter-options` (server-sorted available-first HTML). See [filters.md](filters.md#catalog-vs-availability-critical).

Options (Twig `data-component-options`): `resultsUrl`, `aggregationsUrl`, `filterOptionsUrl`, `baseParams`, `display`, `disableEmptyFilter`, `history`.

## Props (`Product:Listing`)

| Prop | Notes |
|------|--------|
| `searchResult` | Initial SSR result |
| `resultsUrl` / `aggregationsUrl` / `filterOptionsUrl` | Theme routes from bridge `path()` only (not resolved in PHP) |
| `params` | Always-merged query (e.g. `{ search }`) |
| `sidebar` | Listing context flag (bridge / layout; not Results layout) |
| `boxLayout` / `referrerCategoryId` | Forwarded to Results / Box |
| `ariaLiveUpdates` | Default `true` — Results island aria-live announcements |
| `disableEmptyFilter` | Config default; enables `syncAvailability` (reduced aggs) |

Search pagelet bridge (`storefront/page/search/search-pagelet.html.twig`) mounts Listing with `boxLayout="minimal"`.

## Props (`Product:Listing:Results`)

| Prop | Default | Notes |
|------|---------|--------|
| `searchResult` | — | Listing result |
| `boxLayout` / `referrerCategoryId` | `default` / `null` | Box |
| `size` | `md` | Item CVA columns: `sm` denser · `md` default · `lg` sparser |

| size | Item classes |
|------|----------------|
| `sm` | `g-col-6 g-col-md-4 g-col-lg-3 g-col-xl-2` |
| `md` | `g-col-6 g-col-lg-4 g-col-xl-3` |
| `lg` | `g-col-12 g-col-md-6 g-col-lg-4` |

## Blocks

| On | Blocks |
|----|--------|
| Listing | `results` |
| Results | `actions`, `grid` (attrs + block → Grid), `items` (loop block), `item` (Box), `empty` (→ Listing:Empty), `paginationBottom` |
| Actions | `pagination`, `sorting` |
| Empty | `content` (default Alert) |

## Known gaps

- Wishlist listing XHR route not added yet
- Human must rebuild storefront JS after pull
- Results `size` not forwarded from Listing / XHR yet

## Files

| Role | Path |
|------|------|
| Bridge | `storefront/component/product/listing.html.twig` |
| Listing | `components/Product/Listing.{php,html.twig,cva.twig,js}` |
| Results | `components/Product/Listing/Results.{php,html.twig,cva.twig,js}` |
| Actions | `components/Product/Listing/Actions.{html.twig,cva.twig}` |
| Empty | `components/Product/Listing/Empty.{html.twig,cva.twig,css}` |
| Grid | `components/Grid.*` — [grid.md](grid.md) |
| Controller | `src/Controller/ListingController.php` |
| Pagination / Sorting | `components/Pagination.*`, `components/Sorting.*` |
| Filters | [filters.md](filters.md) |
