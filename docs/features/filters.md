# Filters

Theme-owned listing filters. Core filter plugins / `data-filter-*` / OffCanvasFilter are not used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/element/cms-element-sidebar-filter.html.twig` → Drawer:Action + desktop Panel |
| `Filter:Drawer:Action` | Mobile open: lazy fetch/mount `Filter:Drawer`; unmount on close (Cart/Nav shell lifecycle) |
| `Filter:Drawer` | Thin composition — **no** JS. `ViewsTheme:Drawer` + `Filter:Panel` (`layout="stacked"`) |
| `Filter:Panel` | Class-backed shell: Active + aria-live; facets from resolver; `layout` cascades into facet props |
| `FilterFacetResolver` | Maps `listing.aggregations` → ordered `FilterFacet` list (gates, props, order) |
| `Filter:Group` | Disclosure chrome: Toggle + Count; `layout=bar` popover + anchor; `layout=stacked` accordion |
| `Filter:Group:Toggle` | Compact chip button (label + Count + caret); bar: `popovertarget` / `anchor-name` |
| `Filter:Group:Count` | Selection badge; updated via Group `setCount` |
| `Filter:Group:Collapse` | Collapsible body shell (`vi-filter-group-body`); sibling of Group; content slot + default Footer |
| `Filter:Group:Footer` | Body footer chrome; default **Reset** (`data-filter-reset`) |
| `Filter:MultiSelect` / `Range` / `Rating` | Facet controls only; compose Group + Collapse |
| `Filter:Boolean` | Inline bar chip + `Form:Switch` (no Group) |
| `Filter:Active` | Chips via Twig CVA `<template>` clones (no class strings in JS) |
| `Product:Listing` | Owner: control registry, apply/history; URL is filter SoT; `syncControls()` after drawer mount |
| Controller | `FilterDrawerController` — `/vi/filter/drawer/…` HTML |

## Facet resolution (server)

`Filter:Panel.php` `#[PostMount]` calls `FilterFacetResolver::resolve($listing)` → `list<FilterFacet>`.

Each facet is `{ component, props }` rendered with `{{ component(facet.component, facet.props|merge({ layout: layout })) }}` — no aggregation `if`s in Twig. `layout` is presentation (Panel-owned), not resolver data.

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
| Desktop `Filter:Panel` | Always-mounted bar (bridge: `class="d-none d-lg-block"`; default `layout=bar`) |
| `Filter:Drawer` | Disposable mobile view (refetch each open; Panel `layout=stacked`) |

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

## Layout prop

Shared CVA variant prop on Panel, facets, Group, Toggle, and Collapse:

| Value | Default | Behaviour |
|-------|---------|-----------|
| `bar` | yes | Horizontal chip bar; `d-contents` hosts; popover + `position-anchor` bodies |
| `stacked` | — | Column stack; `d-block` hosts; full-width toggles; accordion (no popover attrs) |

Cascade: `Filter:Drawer` → `Filter:Panel layout="stacked"` → merge into each facet → `Filter:Group` / `Toggle` + `Filter:Group:Collapse`. Group JS uses `options.layout === 'stacked'` (no `#vi-filter-drawer` sniff).

### Layout & chrome

`layout=bar` (desktop SSR Panel):

| Piece | Behaviour |
|-------|-----------|
| Panel `items` | CVA `flex-wrap align-items-center` horizontal chip bar |
| Facet hosts | CVA `d-contents` so toggles sit in the bar |
| Group toggle | Compact outline chip + caret; count badge when selected |
| Body | `Filter:Group:Collapse` — HTML Popover API + CSS `position-anchor` / `anchor()` (`bottom-start`); Twig emits `popover` / anchor only for `bar` |
| MultiSelect / Rating options | Chip grid (`d-flex flex-wrap gap-2`); checkbox/radio visually hidden |
| Boolean | Bar chip + [`Form:Switch`](form-input.md#formswitch) (`class="d-inline-flex …"` + `:reverse`; BS form fix in `scss/_form.scss`) |
| Body footer | `Filter:Group:Footer` **Reset** (`viewsTheme.filter.reset`) → facet `data-filter-reset` → control `resetAll` + Listing `apply` |
| Active chips | Below bar (`Filter:Active`) |

`layout=stacked` (mobile `Filter:Drawer`):

| Piece | Behaviour |
|-------|-----------|
| Panel `items` | CVA `flex-column align-items-stretch` |
| Facet hosts | CVA `d-block` |
| Toggle / Boolean chip | CVA `w-100 justify-content-between` |
| Body | `Filter:Group:Collapse` accordion (Group JS); no `popover` / anchor attrs in Twig; CVA `w-100 shadow-none` |

### CSS architecture

| Layer | Path | Role |
|-------|------|------|
| **SCSS (BS quirk)** | `app/storefront/src/scss/_form.scss` | form-check/switch float & negative-margin neutralize |
| **CVA + utilities** | `*.cva.twig` | `layout` variants (bar / stacked), chip grids, hosts |
| **Component CSS** | `components/Filter/*.css` | Popover/anchor (under `[popover]`) + token consume only (`var(--vi-*, fallback)`) |

### CSS tokens (component consume + fallback only)

| Token | Default role |
|-------|----------------|
| `--vi-offset` | Gap under toggle before body |
| `--vi-min-w` / `--vi-max-w` / `--vi-max-h` | Popover shell size |
| `--vi-content-max-h` | Scrollport inside popover body |
| `--vi-chip-active-border` / `--vi-chip-active-bg` / `--vi-chip-disabled-opacity` | Option chips |
| `--vi-swatch` / `--vi-swatch-radius` / `--vi-swatch-border` | Color preview swatch |

Co-located: `Group.css` (popover/anchor + content max-height under `[popover]`), `MultiSelect.css`, `Rating.css`, `Boolean.css` (checked border token).

## Layout placement

One facet **Panel** template. Placement + `layout`:

| Viewport | Behaviour |
|----------|-----------|
| `lg+` | SSR `Filter:Panel` in listing chrome (`class="d-none d-lg-block"`; default `layout=bar`) |
| `< lg` | `Filter:Drawer:Action` fetches `Filter:Drawer` (Panel `layout=stacked`); unmount on close |

Identity hooks: only `data-component="ViewsTheme:…"`. Drawer `id` (`#vi-filter-drawer`) for a11y / multi-drawer disambiguation (not layout detection).

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
| Group + body CSS | `components/Filter/Group.{js,html.twig,cva.twig,css}` (popover/anchor only) |
| Form SCSS | `app/storefront/src/scss/_form.scss` |
| Facet resolver / DTO | `src/Service/FilterFacetResolver.php`, `src/Struct/FilterFacet.php` |
| Group + Toggle / Count / Collapse / Footer | `components/Filter/Group/{Toggle,Count,Collapse,Footer}.*` |
| Facets / Active | `components/Filter/{MultiSelect,Boolean,Range,Rating,Active}.*` |
| Controller | `src/Controller/FilterDrawerController.php` |
| Bridge | `storefront/element/cms-element-sidebar-filter.html.twig` |
| Listing owner | [product-listing.md](product-listing.md) |
