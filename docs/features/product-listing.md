# Product listing

Theme-owned product grid shell: pagination/sorting chrome, result rows, empty state. Mounts `Product:Box` per product. Core includes `component/product/listing.html.twig`; the theme bridge mounts UX `Product:Listing`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/product/listing.html.twig` — thin `sw_extends`; mounts `Product:Listing` |
| `Product:Listing` | Class-backed shell: listing-plugin options, layout normalize, referrer default, gates; composes Pagination, Sorting, Box |
| `Pagination` | Theme page nav — [pagination.md](pagination.md) |
| `Sorting` | Theme sort select — [sorting.md](sorting.md) |
| `Product:Box` | Card per product (see [product-box.md](product-box.md)) |
| Wishlist empty | `Wishlist:Listing` composes Listing + block overrides (see [wishlist.md](wishlist.md)) |

## Wire-up

Every core call site that includes `listing.html.twig` picks up the theme shell:

- Category CMS product listing (`cms-element-product-listing`)
- Search results pagelet
- Wishlist listing (via wishlist bridge → `Wishlist:Listing` → `Product:Listing`)

```twig
{# storefront/component/product/listing.html.twig #}
{% sw_extends '@Storefront/storefront/component/product/listing.html.twig' %}

{% block product_listing %}
    <twig:ViewsTheme:Product:Listing
        :searchResult="searchResult"
        :dataUrl="dataUrl|default(null)"
        :filterUrl="filterUrl|default(null)"
        :params="params|default({})"
        :sidebar="sidebar|default(false)"
        :boxLayout="boxLayout|default('default')"
        :listingColumns="listingColumns|default('col-sm-6 col-lg-4 col-xl-3')"
        :ariaLiveUpdates="ariaLiveUpdates|default(true)"
        :disableEmptyFilter="disableEmptyFilter|default(null)"
    />
{% endblock %}
```

Do not add further storefront listing files beyond the product + wishlist bridges. Extend UX under `components/Product/Listing*`.

## Composition

```
Product:Listing (class VM)
  ├─ root (.cms-element-product-listing-wrapper + data-listing* + data-listing-pagination*)
  └─ content (.cms-element-product-listing)     ← ListingPlugin XHR replace target
       ├─ actions (if hasResults)
       │    ├─ paginationTop → Pagination
       │    └─ sorting → Sorting
       ├─ items (.js-listing-wrapper)
       │    ├─ item × N → Product:Box
       │    └─ or empty → Alert (or Wishlist override)
       └─ paginationBottom → Pagination (if showBottomPagination)
```

## Core JS contract (critical)

Keep these selectors/attrs so core `Listing` / `ListingPagination` / `ListingSorting` keep working:

| Selector / attr | Role |
|-----------------|------|
| `.cms-element-product-listing-wrapper` | Outer host; filter plugins resolve Listing from here |
| `data-listing` + `data-listing-options` | Listing plugin options (URLs, params, snippets, …) |
| `data-listing-pagination` + options | Pagination plugin host (listing root) |
| `.cms-element-product-listing` | Inner shell; **XHR `renderResponse` replaces this node** |
| `.js-listing-wrapper` | Results region; aria-live text source |
| Pagination / Sorting DOM | See [pagination.md](pagination.md) / [sorting.md](sorting.md) |

Theme `vi-product-listing*` classes sit **alongside** the core classes (CVA bases include both).

## Props

### `Product:Listing` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `searchResult` | required | `EntitySearchResult` / product listing result |
| `dataUrl` / `filterUrl` | `null` | Listing plugin fetch URLs |
| `params` | `{}` | Extra request params |
| `sidebar` | `false` | Passed into listing options (bool or `0`/`1`) |
| `boxLayout` | `default` | Empty / `standard` → `default`; forwarded to Box |
| `listingColumns` | `col-sm-6 col-lg-4 col-xl-3` | Appended on each item column |
| `ariaLiveUpdates` | `true` | Listing options flag |
| `disableEmptyFilter` | config `core.listing.disableEmptyFilterOptions` when null | |
| `referrerCategoryId` | config breadcrumb-by-referrer ? request `navigationId` : null | Threaded to Box |
| `cva` | `{}` | Multi-slot via `Listing.cva.twig` |
| `hasResults` / `showBottomPagination` / `paginationPage` | derived | Composition gates |
| `paginationSearchQuery` | derived | `&search=…` when listing has search filter |

`displayMode` is **not** part of the theme Listing/Box API.

### CVA slots (`Listing.cva.twig`)

`root`, `content`, `actions`, `paginationTop`, `sorting`, `items`, `item`, `empty`, `paginationBottom`

### Blocks

| Block | Content |
|-------|---------|
| `actions` | Top actions shell (pagination + sorting) |
| `paginationTop` | `Pagination` location=`top` |
| `sorting` | `Sorting` |
| `items` | Product loop |
| `item` | Column wrapper |
| `box` | `Product:Box` |
| `empty` | Empty shell |
| `emptyAlert` | `ViewsTheme:Alert` |
| `paginationBottom` | `Pagination` location=`bottom` |

Callers override via `<twig:block name="…">` (e.g. `Wishlist:Listing` clears `actions`, replaces `empty`).

Nested overrides: `paginationTop:…`, `sorting:…`, `paginationBottom:…`.

## Behaviour notes

- Box mount is loop data only (`:product`, `:layout`, `:referrerCategoryId`) — sealed leaf pattern for the card
- Layout normalize, referrer default, and pagination search query live in `Listing.php` `#[PostMount]`
- Listing plugin snippet strings stay in Twig (`|trans`) inside `data-listing-options`
- Pagination / Sorting are theme UX; core plugins still drive filter/page XHR

## Known gaps

- No theme UX for filter panel
- Bootstrap `listingColumns` still drive the grid (no tokenized CSS grid yet)
- No co-located Listing CSS/JS (core plugins only)
- Search results pagelet chrome still core; listing body via product listing bridge

## Files

| Role | Path |
|------|------|
| Bridge | `storefront/component/product/listing.html.twig` |
| Listing | `components/Product/Listing.{php,html.twig,cva.twig}` |
| Pagination | `components/Pagination.*` — [pagination.md](pagination.md) |
| Sorting | `components/Sorting.*` — [sorting.md](sorting.md) |
| Box | `components/Product/Box.*` — [product-box.md](product-box.md) |
| Wishlist shell | `components/Wishlist/Listing.html.twig` + wishlist bridge |
