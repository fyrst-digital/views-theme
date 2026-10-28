# Product listing

Theme-owned product grid: owner JS, Results island, Pagination, Sorting, Filters. Core `ListingPlugin` / filter plugins are **not** used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/product/listing.html.twig` → `Product:Listing` + theme `/vi/listing/…` URLs |
| `Product:Listing` | Class VM + **owner JS**: fetch, history, island swap, writes the listing signals. Controls register themselves |
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

Sidebar (sibling): desktop `Filter:Panel` + mobile `Filter:Drawer:Action` — see [filters.md](filters.md). Controls register themselves (URL is filter SoT).

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
| `state.js` | Signals: `attached`, `busy`, `params`, `labels`, `liveText`, `controlsVersion` |
| `controls.js` | Self-registering control registry: `connect` (last-connect-wins stack per control identity), `all` / `active`, `hydrate`, `collectValues`, `activeLabels`, cached filter-options payload |
| `fetch.js` | Results HTML + filter-options + aggregations XHR (abort/seq) |
| `filter-options.js` | Apply options payload / availability onto controls |
| `results-dom.js` | Results island swap, scroll, read the server aria-live text |
| `store.js` | Facade for controls: re-exports the signals, `connectControl`, `apply` / `resetFilters` / `resetOption`. Listing `scope.add(attach(this))` (service provider) |

Domain stays isolated from `review/*` — [javascript.md](../conventions/javascript.md).

| API | Role |
|-----|------|
| `hydrateFromUrl()` | `setFromUrl` on every connected control from `location.search` |
| `syncControls()` | `hydrateFromUrl` + set `labels` + emit `ControlsSynced` (init, popstate) |
| `syncFilterOptions(params?, { built })` | Batch option HTML + meta (preferred); falls back to `syncAvailability`; abort + seq guard |
| `syncAvailability(params?, { built })` | Reduced aggs JSON → `applyAvailability` (fallback); same options abort/seq |
| `apply(patch, { pushHistory, resetPage })` | Results ∥ filter-options → `params` signal is set before the Results swap (new Pagination / Sorting hydrate from it on connect), then push history, hydrate connected controls from **request params** (not stale URL), then options; options abort does not fail Results apply |
| `reset` / `resetFilters` / `resetAll` | `reset(id)` clears one option. `resetFilters(keys)` clears facets by `controlFilterKey` (`null` = all) then apply. `resetAll()` is `resetFilters(null)` |
| `getActiveLabels()` | De-duped chip labels. Listing sets the `labels` signal (also when controls connect / disconnect); `Filter:Active:List` follows it |
| History keys | From control `getParamKeys()` + `baseParams` (not a hard-coded facet list) |
| Active controls | Last connected control per identity; no panel / drawer lookup — never CSS classes |

Controls (filters, pagination, sorting, reset, active chips, filter drawer) talk to `@views-theme/modules/listing/store.js` only — not raw `callMethod`, not a `listingComponent` name, and not other `listing/*` internals. `apply(patch, callOptions)` sends `{ p: 1, ...patch }` with `resetPage: false` unless `callOptions` overrides it. `resetFilters(keys)` clears facets (`keys` omitted = all). `resetOption(id)` removes one chip. The store no-ops when no listing is attached. Review pagination uses `review/store.js`.

The URL stays the shareable selection. The store signals are `attached`, `busy`, `params`, `labels`, `liveText`. Listing sets `busy` around the apply queue and standalone options fetches, `params` when a Results response arrives, `labels` after an apply and whenever controls connect / disconnect, and `liveText` (a fresh object, so equal text re-announces) after the Results swap; `Filter:Panel` writes it into its own live region. A failed apply does not replace labels. The listing is a page singleton (one `Product:Listing` per page), so the signals are not keyed.

Events: `ViewsTheme:Listing:Changed`, `ViewsTheme:Listing:ControlsSynced`, `ViewsTheme:Listing:AvailabilitySynced`, `ViewsTheme:Listing:Loading`. They are thin emitters for outside listeners; the theme follows the signals.

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
| Results | `components/Product/Listing/Results.{php,html.twig,cva.twig,css,js}` |
| Actions | `components/Product/Listing/Actions.{html.twig,cva.twig}` |
| Empty | `components/Product/Listing/Empty.{html.twig,cva.twig,css}` |
| Grid | `components/Grid.*` — [grid.md](grid.md) |
| Controller | `src/Controller/ListingController.php` |
| Pagination / Sorting | `components/Pagination.*`, `components/Sorting.*` |
| Filters | [filters.md](filters.md) |
