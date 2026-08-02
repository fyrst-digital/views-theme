# Filters

Theme-owned listing filters. Core filter plugins / `data-filter-*` / OffCanvasFilter are not used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/element/cms-element-sidebar-filter.html.twig` → Drawer:Action + desktop Panel |
| `Filter:Drawer:Action` | Mobile open: lazy fetch/mount `Filter:Drawer`; unmount on close (Cart/Nav shell lifecycle) |
| `Filter:Drawer` | Thin composition — **no** JS. `ViewsTheme:Drawer` + `Filter:Panel` |
| `Filter:Panel` | Facet shell from `listing.aggregations` + Active + aria-live (desktop SSR + drawer XHR) |
| `Filter:Group` | Single layout: toggle + collapsible body (default closed) |
| `Filter:MultiSelect` | Manufacturer + property options |
| `Filter:Boolean` / `Range` / `Rating` | Facet controls |
| `Filter:Active` | Chips via Twig CVA `<template>` clones; reads labels via Listing instance (`getActiveLabels` — not `callMethod`, which drops returns); `hidden` when no active filters (stays mounted) |
| `Product:Listing` | Owner: control registry, apply/history; URL is filter SoT; `syncControls()` after drawer mount (+ `ControlsSynced`) |
| Controller | `FilterDrawerController` — `/vi/filter/drawer/…` HTML |

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
| `ViewsTheme:Listing:ControlsSynced` | `{ source? }` — after `syncControls()` (init / drawer / popstate hydrate) |
| `ViewsTheme:Listing:Loading` | `{ busy, source? }` |

`Filter:Active` listens to `Changed` + `ControlsSynced` and re-renders chips.

## Query params

Derived from controls + listing `baseParams` (`p`, `order`, `manufacturer`, `properties`, `min-price`, `max-price`, `rating`, `shipping-free`, `search`, …).

## Files

| Role | Path |
|------|------|
| Drawer compose / Action | `components/Filter/Drawer.*`, `components/Filter/Drawer/Action.*` |
| Panel / Group / facets / Active | `components/Filter/{Panel,Group,MultiSelect,Boolean,Range,Rating,Active}.*` |
| Controller | `src/Controller/FilterDrawerController.php` |
| Bridge | `storefront/element/cms-element-sidebar-filter.html.twig` |
| Listing owner | [product-listing.md](product-listing.md) |
