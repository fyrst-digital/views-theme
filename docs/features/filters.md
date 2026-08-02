# Filters

Theme-owned listing filters. Core filter plugins / `data-filter-*` / OffCanvasFilter are not used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/element/cms-element-sidebar-filter.html.twig` → Drawer:Action + desktop Panel |
| `Filter:Drawer:Action` | Mobile open: lazy fetch/mount `Filter:Drawer`; unmount on close (Cart/Nav shell lifecycle) |
| `Filter:Drawer` | Thin composition — **no** JS. `ViewsTheme:Drawer` + `Filter:Panel` |
| `Filter:Panel` | Class-backed shell: Active + aria-live; facets from resolver |
| `FilterFacetResolver` | Maps `listing.aggregations` → ordered `FilterFacet` list (gates, props, order) |
| `Filter:Group` | Single layout: toggle + collapsible body (default closed) |
| `Filter:MultiSelect` | Manufacturer + property options |
| `Filter:Boolean` / `Range` / `Rating` | Facet controls |
| `Filter:Active` | Chips via Twig CVA `<template>` clones (no class strings in JS) |
| `Product:Listing` | Owner: control registry, apply/history; URL is filter SoT; `syncControls()` after drawer mount |
| Controller | `FilterDrawerController` — `/vi/filter/drawer/…` HTML |

## Facet resolution (server)

`Filter:Panel.php` `#[PostMount]` calls `FilterFacetResolver::resolve($listing)` → `list<FilterFacet>`.

Each facet is `{ component, props }` rendered with `{{ component(facet.component, facet.props) }}` — no aggregation `if`s in Twig.

| Aggregation key | Gate | Component |
|-----------------|------|-----------|
| `manufacturer` | entities not empty | `ViewsTheme:Filter:MultiSelect` (`name=manufacturer`, sorted by name) |
| `properties` | entities not empty | `MultiSelect` × group (`name=properties`) |
| `price` | min/max not null | `ViewsTheme:Filter:Range` |
| `rating` | max > 0 | `ViewsTheme:Filter:Rating` |
| `shipping-free` | max > 0 | `ViewsTheme:Filter:Boolean` |

**Add a built-in facet:** extend `FilterFacetResolver` (visibility + props). New control **type** also needs a UX component and a name on `Product:Listing` JS `controlComponents`.

## Shared state

| Piece | Role |
|-------|------|
| URL query | Source of truth (shareable, history) |
| `Product:Listing` | Discover controls, `apply` / `reset`, history, Results XHR, aggs JSON |
| Facet controls | Working DOM; `getValues` / `setFromUrl` |
| Desktop `Filter:Panel` | Always-mounted view (bridge: `class="d-none d-lg-block"`) |
| `Filter:Drawer` | Disposable mobile view (refetch each open) |

No always-mounted `ViewsTheme:Filter` mutation store (filters are URL-driven, not session POSTs like cart).

## Control contract

| Method | Role |
|--------|------|
| `getValues()` | `{ key: string \| string[] }` |
| `getParamKeys()` | Query keys this control owns (even when empty) |
| `getLabels()` | `[{ id, label, previewHex?, previewImageUrl? }]` |
| `setFromUrl(params)` | Hydrate from query (init / popstate / drawer open) |
| `reset(id)` / `resetAll()` | Clear |
| `refreshDisabled?(aggregations)` | Optional empty-filter UX |

Listing **discovers** controls under its root and under the **active** `Filter:Panel` (open drawer Panel when mounted/open; otherwise page sidebar Panel). No per-control `registerControl` required. Chip labels are de-duplicated by id.

## Layout

One facet **Panel** layout (same Twig). Placement:

| Viewport | Behaviour |
|----------|-----------|
| `lg+` | SSR `Filter:Panel` in sidebar (`class="d-none d-lg-block"` on the Panel) |
| `< lg` | `Filter:Drawer:Action` fetches `Filter:Drawer` (Panel inside); unmount on close |

Identity hooks: only `data-component="ViewsTheme:…"`. Drawer `id` (`#vi-filter-drawer`) for a11y / multi-drawer disambiguation.

## Lazy shell flow

1. Click Action → always `GET` drawer URL + **current** `location.search`
2. Mount root on `document.body` → wait for Drawer → `open()`
3. `Listing.syncControls()` (`refreshControls` + `hydrateFromUrl`)
4. On `ViewsTheme:Drawer:Close` → unmount root → `syncControls()` → focus Action

See [JS lazy-loaded shells](../conventions/javascript.md#lazy-loaded-shells-critical).

## Controllers

| Route | Path | Response |
|-------|------|----------|
| `frontend.views-theme.filter.drawer.category` | `/vi/filter/drawer/category/{navigationId}` | HTML `Filter:Drawer` |
| `frontend.views-theme.filter.drawer.search` | `/vi/filter/drawer/search` | HTML `Filter:Drawer` (`search` required) |

Loaders: `AbstractProductListingRoute` / `AbstractProductSearchRoute` with `only-aggregations` + `reduce-aggregations`. Render via `AbstractComponentController::renderComponent()`.

## Events

| Event | Payload |
|-------|---------|
| `ViewsTheme:Listing:Changed` | `{ ok, params?, error?, source? }` |
| `ViewsTheme:Listing:Loading` | `{ busy, source? }` |

## Query params

Derived from controls + listing `baseParams` (`p`, `order`, `manufacturer`, `properties`, `min-price`, `max-price`, `rating`, `shipping-free`, `search`, …).

## Files

| Role | Path |
|------|------|
| Drawer compose / Action | `components/Filter/Drawer.*`, `components/Filter/Drawer/Action.*` |
| Panel (class + Twig) | `components/Filter/Panel.{php,html.twig,js,cva.twig}` |
| Facet resolver / DTO | `src/Service/FilterFacetResolver.php`, `src/Struct/FilterFacet.php` |
| Group / facets / Active | `components/Filter/{Group,MultiSelect,Boolean,Range,Rating,Active}.*` |
| Controller | `src/Controller/FilterDrawerController.php` |
| Bridge | `storefront/element/cms-element-sidebar-filter.html.twig` |
| Listing owner | [product-listing.md](product-listing.md) |
