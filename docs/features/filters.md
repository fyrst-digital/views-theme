# Filters

Theme-owned listing filters. Core filter plugins / `data-filter-*` / OffCanvasFilter are not used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/element/cms-element-sidebar-filter.html.twig` → Shell + Action + Host + Panel + Drawer |
| `Filter:Shell` | Scopes Action queries to one filter region |
| `Filter:Action` | Mobile open: moves live Panel Host → DrawerSlot (no `innerHTML` clone) |
| `Filter:Host` | Desktop home for Panel (`d-none d-lg-block`) |
| `Filter:DrawerSlot` | Drawer drop target for Panel |
| `Filter:Panel` | Facet shell from `listing.aggregations` + Active + aria-live |
| `Filter:Group` | Single layout: toggle + collapsible body (default closed) |
| `Filter:MultiSelect` | Manufacturer + property options |
| `Filter:Boolean` / `Range` / `Rating` | Facet controls |
| `Filter:Active` | Chips via Twig CVA `<template>` clones (no class strings in JS) |
| `Product:Listing` | Owner: discover controls in listing el + panels; history keys from `getParamKeys()` |

## Control contract

| Method | Role |
|--------|------|
| `getValues()` | `{ key: string \| string[] }` |
| `getParamKeys()` | Query keys this control owns (even when empty) |
| `getLabels()` | `[{ id, label, previewHex?, previewImageUrl? }]` |
| `setFromUrl(params)` | Hydrate from query (init / popstate only) |
| `reset(id)` / `resetAll()` | Clear |
| `refreshDisabled?(aggregations)` | Optional empty-filter UX |

Listing **discovers** controls under its root and under every `Filter:Panel` (no per-control `registerControl` required).

## Layout

One regular facet layout. Placement is page structure/CSS.

| Viewport | Behaviour |
|----------|-----------|
| `lg+` | Panel in `Filter:Host` |
| `< lg` | `Filter:Action` moves Panel into `Filter:DrawerSlot` inside theme Drawer |

Identity hooks: only `data-component="ViewsTheme:…"`. Drawer `id` is for a11y / multi-drawer disambiguation.

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
| Shell / Host / DrawerSlot | `components/Filter/{Shell,Host,DrawerSlot}.*` |
| Action | `components/Filter/Action.*` |
| Panel / Group / facets / Active | `components/Filter/{Panel,Group,MultiSelect,Boolean,Range,Rating,Active}.*` |
| Bridge | `storefront/element/cms-element-sidebar-filter.html.twig` |
| Listing owner | [product-listing.md](product-listing.md) |
