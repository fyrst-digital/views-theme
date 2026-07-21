# Search overlay

Lazy-loaded full-viewport search dialog opened from the header search action.

All UI lives under UX components (`components/Search/*`). Markup is served by theme widget routes — no storefront template overrides for search.

## Features

- Header `Search:Action` opens `Search:Overlay` on click
- Overlay HTML is fetched once from a dedicated theme widget and cached client-side
- Wide centered panel (command-palette style): search chrome + in-panel product list + “View all” footer
- `Search:Bar` owns suggest UX (debounce, fetch, DOM insert) — **not** core `SearchWidgetPlugin`
- Suggest HTML is rendered by the theme controller as `ViewsTheme:Search:Suggest` with explicit props
- Close via isolated `Search:Overlay:Close` / `Search:Overlay:Backdrop`, Escape, or toggling the action again
- Body scroll lock while open; focus returns to the action on close

## Layout notes

- Styling is **Bootstrap utilities first** (in sibling `*.cva.twig`). Custom SCSS in `search.scss` is last resort only.
- Overlay open/close toggles `d-none` / `d-flex` in `Overlay.js`.
- Backdrop and Close are nested UX components under `Search/Overlay/`.
- Suggest is inserted as the **next sibling after the bar form**.
- Product rows (`Search:Suggest:Item`): compose `Product:Cover` (`showLink=false`), local manufacturer/category meta, `Product:Name` (`showLink=false`), and compact `Product:Price` (`showTieredPrices=false`, `showTaxNote=false`, list price via shared Price component).
- Suggest subcomponents (Heading, Results, Item, Summary, Empty) live nested under `Search/Suggest/`.
- Product results compose `ViewsTheme:Scroll:Area` (body → default `content` block). Fade styles live in co-located `Scroll/Area.css` (`.vi-scroll-area`, `--scroll-fade: 40px`); JS toggles `data-scroll-up` / `data-scroll-down` so fades hide at the corresponding edge (and when content does not overflow).

## How it works

### Open flow

1. `ViewsTheme:Search:Action` reads `overlayUrl` from `data-component-options`
2. First click fetches `frontend.views-theme.search.overlay`
3. Response HTML is appended to `document.body`
4. Shopware component system initializes `ViewsTheme:Search:Overlay` and nested `ViewsTheme:Search:Bar`
5. Subsequent clicks toggle the existing overlay instance

### Close flow

1. `Search:Overlay:Backdrop` / `Search:Overlay:Close` dispatch bubbled `ViewsTheme:Search:Overlay:dismiss`
2. `Search:Overlay` listens and calls `close()`
3. `Escape` also calls `close()`

### Suggest flow

`ViewsTheme:Search:Bar` (`Bar.js`):

1. Debounced `input` on the search field
2. If term length ≥ `minChars`, `GET` theme route with `search` query param
3. Abort previous in-flight request
4. Mount HTML **after the form**
5. Wire keyboard focus + analytics custom events

```
frontend.views-theme.search.suggest
```

Controller loads `SuggestPageLoader`, then:

```twig
{{ component('ViewsTheme:Search:Suggest', {
    searchResult: page.searchResult,
    searchTerm: page.searchTerm,
}) }}
```

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.search.overlay` | `/widgets/search/overlay` | `GET` (XHR) |
| `frontend.views-theme.search.suggest` | `/widgets/search/suggest` | `GET` (XHR) |

## Hooks

| Component | Attribute |
|-----------|-----------|
| Action button | `data-component="ViewsTheme:Search:Action"` |
| Overlay root | `data-component="ViewsTheme:Search:Overlay"` |
| Backdrop | `data-component="ViewsTheme:Search:Overlay:Backdrop"` |
| Close | `data-component="ViewsTheme:Search:Overlay:Close"` |
| Search bar | `data-component="ViewsTheme:Search:Bar"` |
| Scroll area (results grid) | `data-component="ViewsTheme:Scroll:Area"` |
| View all | `data-action="view-all"` |

Bar options (`data-component-options`): `suggestUrl`, `minChars`, `delay`.

See [JavaScript conventions](../conventions/javascript.md).

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/SearchOverlayController.php` |
| Overlay | `src/Resources/views/components/Search/Overlay.*` |
| Backdrop / Close | `src/Resources/views/components/Search/Overlay/Backdrop.*`, `Close.*` |
| Action | `src/Resources/views/components/Search/Action.*` |
| Bar | `src/Resources/views/components/Search/Bar.*` |
| Suggest | `src/Resources/views/components/Search/Suggest.*` |
| Suggest children | `src/Resources/views/components/Search/Suggest/{Heading,Results,Item,Summary,Empty}.*` |
| Scroll area | `src/Resources/views/components/Scroll/Area.*` |
| Product pieces used by suggest | `src/Resources/views/components/Product/Cover.html.twig`, `Name.html.twig`, `Price.html.twig` |
| SCSS | `src/Resources/app/storefront/src/scss/component/search.scss` |
