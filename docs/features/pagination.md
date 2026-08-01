# Pagination

Theme-owned page navigation with optional `Product:Listing` integration.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/pagination.html.twig` → `Pagination` |
| `Pagination` | Class VM (page window) + control API for Listing (`getParamKeys` → `p`) |
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
- Item options: `data-component-options` `{ page }`
- Icons (nav ends): `arrow-left` / `arrow-right`, `caret-left` / `caret-right`
- With Listing on page: item `preventDefault` + `callMethod(Listing, 'apply', { p })`
- Without Listing (e.g. VariantsGrid href mode): native link navigation (bubble handlers may intercept)

## Props

See class `Pagination.php`: `entities` or `currentPage`/`totalPages`, `location`, `href`, `pageParameter`, `searchQuery`.

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
