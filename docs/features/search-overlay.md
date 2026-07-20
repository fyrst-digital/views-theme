# Search overlay

Lazy-loaded full-viewport search dialog opened from the header search action.

All UI lives under UX components (`components/Search/*`). Markup is served by theme widget routes — no storefront template overrides for search.

## Features

- Header `Search:Action` opens `Search:Overlay` on click
- Overlay HTML is fetched once from a dedicated theme widget and cached client-side
- Wide centered panel (command-palette style): search chrome + in-panel product list + “View all” footer
- Overlay composes `Search:Bar` and uses core `SearchWidgetPlugin` for debounce/fetch UX
- Suggest HTML is rendered by the theme controller as `ViewsTheme:Search:Suggest` with explicit props
- Close via close button, backdrop click, Escape, or toggling the action again
- Body scroll lock while open; focus returns to the action on close

## Layout notes

- `Search:Bar` keeps submit as a **direct form child after the chrome row** so `SearchWidgetPlugin` injects suggest markup under the input (not inside the chrome flex row).
- Suggest is **in-flow** inside the panel (not a floating absolute dropdown).
- Product rows: thumb · optional manufacturer/category meta · name · compact price (+ strikethrough list price).
- No category filter, articles column, or voice search in the current scope.

## How it works

### Open flow

1. `ViewsTheme:Search:Action` reads `overlayUrl` from `data-component-options`
2. First click fetches `frontend.views-theme.search.overlay`
3. Response HTML is appended to `document.body`
4. Shopware component system initializes `ViewsTheme:Search:Overlay`
5. `PluginManager.initializePluginsInParentElement` boots `SearchWidgetPlugin` on the bar form
6. Subsequent clicks toggle the existing overlay instance (no extra network request)

### Suggest flow

`Search:Bar` keeps core plugin hooks (`data-search-widget`, `.js-search-form`, `.js-search-result`) but points `data-url` at the **theme** route:

```
frontend.views-theme.search.suggest
```

That controller loads `SuggestPageLoader`, then renders:

```twig
{{ component('ViewsTheme:Search:Suggest', {
    searchResult: page.searchResult,
    searchTerm: page.searchTerm,
}) }}
```

Props are passed **explicitly**. Self-closing UX tags do not inherit outer Twig context (`page`), so never rely on `page.*` inside a `component()` render without props.

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.search.overlay` | `/widgets/search/overlay` | `GET` (XHR) |
| `frontend.views-theme.search.suggest` | `/widgets/search/suggest` | `GET` (XHR) |

Overlay optional query params:

| Param | Purpose |
|-------|---------|
| `search` | Prefill bar value |
| `minSearchLength` | Override min chars for suggest |

Suggest uses the same `search` query param as core (`?search=`).

## Hooks

| Component | Attribute |
|-----------|-----------|
| Action button | `data-component="ViewsTheme:Search:Action"` |
| Overlay root | `data-component="ViewsTheme:Search:Overlay"` |
| Backdrop | `data-ref="backdrop"` |
| Close control | `data-ref="close"` |
| Search form | `data-ref="search-bar"` (on `Search:Bar`) |

See [JavaScript conventions](../conventions/javascript.md).

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/SearchOverlayController.php` |
| Overlay | `src/Resources/views/components/Search/Overlay.*` |
| Action | `src/Resources/views/components/Search/Action.*` |
| Bar / Suggest | `src/Resources/views/components/Search/` |
| SCSS | `src/Resources/app/storefront/src/scss/component/search.scss` |
