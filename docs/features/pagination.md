# Pagination

Theme-owned page navigation with optional `Product:Listing` integration.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/pagination.html.twig` → `Pagination` |
| `Pagination` | Class VM (page window) + `Pagination.js` |
| `Product:Listing` | When present, clicks call `apply({ p })` instead of full navigation |

No core `ListingPagination` plugin.

## Behaviour

- Markup: `nav[data-component="ViewsTheme:Pagination"]` + `a[data-page]`
- Icons: `arrow-left` / `arrow-right`, `caret-left` / `caret-right`
- With Listing on page: `preventDefault` + `callMethod(Listing, 'apply', { p })`
- Without Listing (e.g. VariantsGrid href mode): native link navigation

## Props

See class `Pagination.php`: `entities` or `currentPage`/`totalPages`, `location`, `href`, `pageParameter`, `searchQuery`.

## Files

`components/Pagination.{php,html.twig,cva.twig,js}` · bridge `storefront/component/pagination.html.twig`
