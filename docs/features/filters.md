# Filters

Theme-owned listing filters. Core filter plugins / `data-filter-*` / OffCanvasFilter are not used.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/element/cms-element-sidebar-filter.html.twig` → Drawer:Action + desktop Panel; reads product-listing CMS config |
| `Filter:Drawer:Action` | Mobile open: lazy fetch/mount `Filter:Drawer`; unmount on close (Cart/Nav shell lifecycle); forwards `showActive` via `viShowActiveFilters`. Button chrome: `icon=sliders`, `size=sm`, `full`, `color=outline-primary`, `d-lg-none` |
| `Filter:Drawer` | Thin composition — **no** JS. `ViewsTheme:Drawer` + `Filter:Panel` (`layout="stacked"` always; `showActive` from CMS) |
| `Filter:Panel` | Class-backed shell: optional Active + aria-live; facets from resolver; `layout` cascades into facet props |
| `FilterFacetResolver` | Maps `listing.aggregations` → ordered `FilterFacet` list (gates, props, order) |
| `FilterFacetPipeline` | Resolve catalog + optional reduced availability (Panel SSR + batch options) |
| `FilterRequestSelection` | Parse selected ids from request (`splitParam`) |
| `FilterAvailabilityApplier` | Pure facet mutation from reduced aggs |
| `ProductListingGateway` | Category/search listing I/O for drawer + options + results |
| `Filter:Group` | **Disclosure host**: Toggle + empty content; JS open/close/fit via Toggle `controls` id; `setCount` / `close()`; dismiss on `Listing:Loading` |
| `Filter:Group:Toggle` | Compact chip button (label + Count + caret); bar: `popovertarget` / `anchor-name` |
| `Filter:Group:Count` | Selection badge; count SoT = `options.count`; `setCount` paints (Group delegates) |
| `Filter:Group:Collapse` | **Body shell** (popover/accordion root only). Facets compose controls + Footer as direct children; shared `id` with Group |
| `Filter:Group:Footer` | Reset chrome: `ViewsTheme:Button` (`color=link` `size=sm`, `data-filter-reset`); composed by facets inside Collapse |
| `Filter:Chip` | Option chip (`<label>` root / btn face); hidden checkbox/radio + optional swatch (`previewImageUrl` preferred over `previewHex`); `size` CVA (`sm` default, `md`) |
| `Filter:MultiSelect` / `Range` / `Rating` | Facet control roots + contract; compose Group → Collapse → controls + Footer (shared `id`). Range: number fields + `Form:Slider` (`mode=range`) |
| `Filter:Boolean` | Inline bar chip + `Form:Switch` (no Group) |
| `Filter:Active` | Remove chips via Twig CVA `<template>` clones (no class strings in JS); swatch from `getLabels` `previewImageUrl` / `previewHex` |
| `Product:Listing` | Owner: control registry, apply/history; URL is filter SoT; `syncControls()` after drawer mount |
| Controller | `FilterDrawerController` — `/vi/filter/drawer/…` HTML |

## Facet resolution (server)

`Filter:Panel.php` `#[PostMount]` uses `FilterFacetPipeline::resolveWithAvailability(...)` → `list<FilterFacet>`.

Each facet is `{ component, props }` rendered with `{{ component(facet.component, facet.props|merge({ layout: layout })) }}` — no aggregation `if`s in Twig. `layout` is presentation (Panel-owned), not resolver data. `FilterFacet::key()` is the batch options key SoT.

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
| URL query | Selection SoT (shareable, history) |
| **Catalog** | Full facet + option lists in the Panel DOM (SSR without `reduce-aggregations`) |
| **Availability** | Which facets show / options enable — reduced aggregations JSON only |
| `Product:Listing` | Discover controls, hydrate, `syncAvailability`, apply/history, Results XHR |
| Facet controls | Working DOM; `getValues` / `setFromUrl` / `applyAvailability` |
| Desktop `Filter:Panel` | Always-mounted (bridge: `class="d-none d-lg-block"`; `layout` from CMS `viewsTheme.value.filterLayout`, default `bar`; `showActive` from CMS) |
| `Filter:Drawer` | Disposable mobile view (refetch each open; Panel `layout=stacked` forced; `showActive` from CMS; **full catalog** SSR) |

No always-mounted `ViewsTheme:Filter` mutation store (filters are URL-driven, not session POSTs like cart).

### Catalog vs availability (critical)

| Layer | Source | Mutates |
|-------|--------|---------|
| Catalog | Page listing aggs / drawer `only-aggregations` (**no** reduce) | Full option nodes always in DOM |
| Availability | Reduced aggs (`only-aggregations` + `reduce-aggregations` + current filters) | Empty facets **visible + disabled** (toggle + options); invalid options `disabled`; **available options sorted first** (SSR + client) |
| Selection | URL / request | Checked state |

**Property multi-select (OR within group):** core’s properties listing filter uses `exclude=false`, so reduced `properties` aggs drop sibling options once one option in a group is selected. Core storefront JS therefore **does not disable** other options in a property group that already has a selection (`FilterPropertySelectPlugin`). Views mirrors that in `FilterAvailabilityApplier` (SSR + batch `filter-options`: when the group’s `selectedIds` is non-empty, `allowedIds` = full catalog group) and in `MultiSelect.applyAvailability` fallback. Manufacturer multi-select has no such unlock — only checked rows stay enabled when missing from reduced aggs.

**SSR (first paint):** when `disableEmptyFilter` and the request has filter params, `FilterFacetPipeline` loads reduced aggs and applies availability (`disabled` / `allowedIds` / `selectedIds`) before Twig. No flash of invalid filters.

**Client (live updates):** Listing **`syncFilterOptions()`** batch-fetches option list HTML + meta (server owns available-first order and disabled flags):

| When | Notes |
|------|--------|
| `init` | After hydrate (revalidate) |
| `apply` success | In parallel with Results XHR |
| Drawer open/close | After `syncControls` (awaited) |

Closed groups update in the background (no open required). Falls back to reduced-aggs JSON (`syncAvailability`) if `filterOptionsUrl` is missing.

**Stale races:** filter-options and availability fetches use a dedicated `AbortController` plus a monotonic sequence. A newer options request aborts the previous one; completed responses whose seq no longer matches are ignored so rapid apply / drawer open cannot paint outdated option HTML or disabled state. Results HTML keeps its own abort (opening the drawer does not cancel an in-flight Results swap).

Panel listens to `ViewsTheme:Listing:Loading` (`aria-busy`) during standalone options/availability fetch.

Drawer catalog must **not** use `reduce-aggregations` on the drawer HTML load. Option order/disabled come from SSR Panel applier + batch `filter-options`.

## Control contract

| Method | Role |
|--------|------|
| `getValues()` | `{ key: string \| string[] }` |
| `getParamKeys()` | Query keys this control owns (even when empty) |
| `getLabels()` | `[{ id, label, previewHex?, previewImageUrl? }]` — Active chips paint image-over-hex swatch when present |
| `setFromUrl(params)` | Hydrate from query (init / popstate / drawer open) |
| `reset(id)` / `resetAll()` | Clear |
| `replaceOptions(html)` | MultiSelect: swap `[data-filter-options]` list from batch |
| `applyOptionsMeta(meta)` | Toggle disabled/count (and Boolean/Rating state) from batch meta |
| `applyAvailability(aggregations)` | Fallback when batch URL missing |
| `refreshDisabled?(aggregations)` | Deprecated alias → `applyAvailability` |

Listing **discovers** controls under its root and under the **active** `Filter:Panel` (open drawer Panel when mounted/open; otherwise page sidebar Panel). No per-control `registerControl` required. Chip labels are de-duplicated by id.

## CMS presentation config

Theme extends core product-listing CMS element config (admin override + `defaultConfig` merge). Presentation only — does not change which aggregations load.

Namespaced under one Shopware FieldConfig key (`source` + `value` blob):

```js
viewsTheme: {
  source: 'static',
  value: {
    filterLayout: 'bar',       // 'bar' | 'stacked'
    showActiveFilters: true,
  },
}
```

| Path | Type | Default | Applies to |
|------|------|---------|------------|
| `viewsTheme.value.filterLayout` | `bar` \| `stacked` | `bar` | **Desktop** `Filter:Panel` only (bridge). Drawer always `stacked`. |
| `viewsTheme.value.showActiveFilters` | bool | `true` | Desktop Panel **and** Drawer Panel |

Bridge reads `cmsPage.getFirstElementOfType('product-listing').config.viewsTheme.value`. Missing keys / search (no slot) → defaults above. Drawer XHR has no CMS page: Action sends `viShowActiveFilters=0|1`; `FilterDrawerController` passes `showActive` into `Filter:Drawer`.

Config is **per content language** (cms slot translation). Save once per language you use on the storefront.

Admin: `src/Resources/app/administration/` — mutates `cmsService` product-listing `defaultConfig.viewsTheme`; overrides `sw-cms-el-config-product-listing` filter tab (theme info banner + layout select + active switch).

## Layout prop

Shared CVA variant prop on Panel, facets, Group, and Toggle:

| Value | Default | Behaviour |
|-------|---------|-----------|
| `bar` | yes | Horizontal chip bar; **real box** facet hosts; popover + `position-anchor` bodies |
| `stacked` | — | Column stack; `d-block w-100` hosts; full-width toggles; accordion (no popover attrs) |

Cascade: desktop bridge → `layout` from CMS (`viewsTheme.value.filterLayout`); `Filter:Drawer` → `Filter:Panel layout="stacked"` (forced) → merge into each facet → Group → Collapse. Group JS uses `options.layout === 'stacked'` (no `#vi-filter-drawer` sniff).

`showActive` (Panel prop, default `true`): when false, `Filter:Active` is not rendered.

### Box tree (critical)

Popover bodies must not sit under nested `display: contents` hosts (top-layer paint / empty shell bugs).

| Rule | Detail |
|------|--------|
| Facet host (bar) | Real box: `d-inline-flex` (MultiSelect / Range / Rating / Boolean) |
| Facet host (stacked) | `d-block w-100` |
| `Filter:Group` | Real box filling the facet; owns toggle; body is Collapse in content |
| `Filter:Group:Collapse` | Popover/accordion body shell (`vi-filter-group-body`); facets put controls + Footer as direct children |
| Empty facets | Stay in the bar; Group toggle + options `disabled` (not `hidden`) |
| No `d-contents` | Do not use contents on filter bar hosts or Group |

### Layout & chrome

`layout=bar` (desktop SSR Panel):

| Piece | Behaviour |
|-------|-----------|
| Panel `items` | CVA `flex-wrap align-items-center` horizontal chip bar |
| Facet hosts | One flex item each (`d-inline-flex`) |
| Group | Disclosure host inside facet; toggle chip; content = Collapse |
| Collapse | HTML Popover API + CSS `position-anchor` / `anchor()`; Twig emits `popover` / anchor only for `bar` |
| Placement | Group JS on open: flip `bottom-start` ↔ `top-start` by viewport space; clamp Collapse `max-height` to fit |
| MultiSelect / Rating options | Chip grid (`d-flex flex-wrap gap-2`); `li` → `Filter:Chip` (hidden control) |
| Facet host CVA | MultiSelect / Range / Rating: `root` + nested `group` / `collapse` / `footer` (+ control slots) with `class` + attrs on children. MultiSelect list chrome SoT = `MultiSelect:Options` CVA (`root`/`item`); batch HTML is Options-only; `replaceOptions` keeps the SSR `<ul>` (host `options:class`) and swaps children only. Rating list/item/chip stay host-owned. Range: `body` → fields (min/max + currency `unit` + divider) + `Form:Slider` (`mode=range`); JS syncs fields ↔ slider; empty field = bound (no query param). Slider applies on **thumb release** (`change`) only — not while dragging (`input` = field preview). Number fields still debounced-apply on type. Boolean: `chip` DOM + `switch` CVA → `Form:Switch` (`:reverse`; BS form fix in `scss/_form.scss`) |
| Body footer | `Filter:Group:Footer` **Reset** → facet `data-filter-reset` → control `resetAll` + Listing `apply` |
| Active chips | Below bar (`Filter:Active`) when `showActive` |
| On apply / listing load | Facet closes Group (`close()`); Group also dismisses on `ViewsTheme:Listing:Loading` `{ busy: true }` |

`layout=stacked` (mobile `Filter:Drawer`):

| Piece | Behaviour |
|-------|-----------|
| Panel `items` | CVA `flex-column align-items-stretch` |
| Facet hosts | CVA `d-block w-100` |
| Toggle / Boolean chip | CVA `w-100 justify-content-between` |
| Body | Accordion (Group JS); no `popover` / anchor attrs in Twig; CVA `w-100 shadow-none` |

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
| `--vi-chip-active-border` / `--vi-chip-active-bg` / `--vi-chip-disabled-opacity` | Option chips |
| `--vi-swatch` / `--vi-swatch-radius` / `--vi-swatch-border` | Color preview swatch |

Co-located: `Group.css` (popover/anchor + body max-height under `[popover]`), `Panel.css` (availability pending), `Chip.css` (option chips), `Boolean.css` (checked border token).

## Layout placement

One facet **Panel** template. Placement + `layout`:

| Viewport | Behaviour |
|----------|-----------|
| `lg+` | SSR `Filter:Panel` in listing chrome (`class="d-none d-lg-block"`; `layout` from CMS, default `bar`) |
| `< lg` | `Filter:Drawer:Action` fetches `Filter:Drawer` (Panel `layout=stacked` always); unmount on close |

Identity hooks: only `data-component="ViewsTheme:…"`. Drawer `id` (`#vi-filter-drawer`) for a11y / multi-drawer disambiguation (not layout detection).

## Lazy shell flow

1. Click Action → always `GET` drawer URL + **current** `location.search` (full catalog; no reduce)
2. Mount root on `document.body` → wait for Drawer → `open()`
3. `Listing.syncControls()` then `await syncAvailability()` (hydrate + reduced aggs)
4. On `ViewsTheme:Drawer:Close` → unmount root → `syncControls` + `syncAvailability` → focus Action

See [JS lazy-loaded shells](../conventions/javascript.md#lazy-loaded-shells-critical).

## Controllers

| Route | Path | Response |
|-------|------|----------|
| `frontend.views-theme.filter.drawer.category` | `/vi/filter/drawer/category/{navigationId}` | HTML `Filter:Drawer` |
| `frontend.views-theme.filter.drawer.search` | `/vi/filter/drawer/search` | HTML `Filter:Drawer` (`search` required) |
| `frontend.views-theme.listing.category.filter-options` | `/vi/listing/category/{id}/filter-options` | JSON `{ options, meta }` |
| `frontend.views-theme.listing.search.filter-options` | `/vi/listing/search/filter-options` | JSON `{ options, meta }` |

`options` keys: `manufacturer`, `properties:{groupId}`, … → MultiSelect `<ul data-filter-options>` HTML.  
`meta` keys: same + `shipping-free` / `rating` → `{ disabled, count?, checked?, allowedMax?, selectedValue? }`.

Property facet `filterKey` / batch key uses the **property group UUID** (`propertyName` prop), not the translated label. URL selection stays `properties=optionId|optionId`.

Boolean availability looks up reduced max by facet `name` (today `shipping-free`).

Drawer loaders: `only-aggregations` (full catalog). Filter-options builder: catalog + reduced + applier + `MultiSelect:Options` render (**two** listing loads per batch by design — catalog then reduced).

SSR Panel: when `disableEmptyFilter` and the request already has filter params, Panel runs an extra reduced aggregation so first paint has correct disabled state (then client may revalidate via filter-options).

## Events

| Event | Payload |
|-------|---------|
| `ViewsTheme:Listing:Changed` | `{ ok, params?, error?, source? }` |
| `ViewsTheme:Listing:ControlsSynced` | `{ source? }` after hydrate |
| `ViewsTheme:Listing:AvailabilitySynced` | `{ ok, params?, error?, source? }` after reduced aggs applied |
| `ViewsTheme:Listing:Loading` | `{ busy, source?, availability? }` |

## Query params

Derived from controls + listing `baseParams` (`p`, `order`, `manufacturer`, `properties`, `min-price`, `max-price`, `rating`, `shipping-free`, `search`, …).

## Files

| Role | Path |
|------|------|
| Drawer compose / Action | `components/Filter/Drawer.*`, `components/Filter/Drawer/Action.*` |
| CMS admin config extension | `app/administration/src/extension/sw-cms/elements/product-listing/` + `main.js` |
| Panel (class + Twig + busy CSS) | `components/Filter/Panel.{php,html.twig,js,cva.twig,css}` |
| Group disclosure host + popover CSS | `components/Filter/Group.{js,html.twig,cva.twig,css}` (CSS targets Collapse root `.vi-filter-group-body`) |
| Form SCSS | `app/storefront/src/scss/_form.scss` |
| Facet resolver / DTO | `src/Service/FilterFacetResolver.php`, `src/Struct/FilterFacet.php` |
| Reduced aggs loader | `src/Service/FilterAggregationLoader.php` |
| SSR/client availability mark | `src/Service/FilterAvailabilityApplier.php` |
| Batch options payload | `src/Service/FilterOptionsPayloadBuilder.php` |
| MultiSelect options fragment | `components/Filter/MultiSelect/Options.*` |
| Toggle / Count / Collapse / Footer | `components/Filter/Group/{Toggle,Count,Collapse,Footer}.*` |
| Chip / Facets / Active | `components/Filter/{Chip,MultiSelect,Boolean,Range,Rating,Active}.*` |
| Range slider primitive | `components/Form/Slider.*` — [form-input.md](form-input.md#formslider) |
| Controller | `src/Controller/FilterDrawerController.php` |
| Bridge | `storefront/element/cms-element-sidebar-filter.html.twig` |
| Listing owner | [product-listing.md](product-listing.md) |
