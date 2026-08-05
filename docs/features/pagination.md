# Pagination

Theme-owned page navigation with optional `Product:Listing` integration.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/pagination.html.twig` → `Pagination` |
| `Pagination` | Class VM (page window, href query) + control API for Listing (`p`) |
| `Pagination:Item` | Leaf anchor; own click → Listing `apply({ p })` when present |
| `Product:Listing` | When present, item clicks call `apply({ p })` instead of full navigation |

No core `ListingPagination` plugin.

## Composition

```
Pagination (nav, data-component control)
├─ Pagination:Item  (first)
├─ Pagination:Item  (prev)
├─ Pagination:Item  × N (pages)
├─ Pagination:Item  (next)
└─ Pagination:Item  (last)
```

No list wrapper — items are direct children of `<nav>`.

Chrome is **CVA utilities** on root + `Item` (gap, hit target, border, active/disabled) — no Bootstrap `pagination` / `page-link` list chrome.

## Behaviour

- Markup: `nav[data-component="ViewsTheme:Pagination"]` + `a[data-component="ViewsTheme:Pagination:Item"]`
- Root options: `data-component-options` `{ page, pageParameter }`
- Item options: `data-component-options` `{ page }`
- Icons (nav ends): `arrow-left` / `arrow-right`, `caret-left` / `caret-right`
- With Listing on page: item `preventDefault` + `callMethod(Listing, 'apply', { p })`
- Without Listing (e.g. VariantsGrid href mode): native link navigation (bubble handlers may intercept)

### Href query (filters ↔ page)

Listing pagination **preserves the current request query** on every page link (filters, `order`, `search`, …) and only overwrites the page parameter.

| Prop | Role |
|------|------|
| `preserveQuery` | When `true` and `query` empty, build from `RequestStack` (listing / storefront bridge) |
| `query` | Explicit `array<string, string>` of params to keep |
| `searchQuery` | Legacy `&search=…` suffix; merged only if `query` empty |
| `pageParameter` | Default `p`; VariantsGrid uses `variantsPage` |

**Denylist** (never copied from the request into hrefs): `boxLayout`, `referrerCategoryId`, `no-aggregations`, `only-aggregations`, `reduce-aggregations`, `slots`.

**VariantsGrid** leaves `preserveQuery` false so links stay `?variantsPage=N` only.

Primary Listing clicks still use JS `apply` + `_collectValues()`; correct hrefs matter for middle-click / open-in-new-tab / no-JS / copy-link.

### Listing control API

| Method | Behaviour |
|--------|-----------|
| `getParamKeys()` | `[pageParameter]` (default `p`) |
| `getValues()` | `{ p: _page }` from URL-hydrated state (not stale active DOM after popstate) |
| `setFromUrl(params)` | Sets internal `_page` from query (default `1`) |

Init seeds `_page` from root options / active item; Listing `syncControls()` re-hydrates from the URL on popstate so page and filters stay in sync.

## Props

See class `Pagination.php`: `entities` or `currentPage`/`totalPages`, `location`, `href`, `pageParameter`, `query`, `preserveQuery`, `searchQuery` (legacy).

`Pagination:Item`: `page`, `href`, `disabled`, `active`, `icon`, `label` (aria), `cva`.

## Blocks / nests

| On | Blocks / nests |
|----|----------------|
| Pagination | `root`, `first`, `prev`, `pages`, `page`, `next`, `last` |
| Item | `content` |

## Files

| Role | Path |
|------|------|
| Parent | `components/Pagination.{php,html.twig,cva.twig,js}` |
| Item | `components/Pagination/Item.{html.twig,cva.twig,js}` |
| Bridge | `storefront/component/pagination.html.twig` |
