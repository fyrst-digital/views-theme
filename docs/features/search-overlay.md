# Search overlay

Lazy-loaded full-viewport search dialog opened from the header search action.

## Features

- Header `Search:Action` opens `Search:Overlay` on click
- Overlay HTML is fetched once from a dedicated storefront widget and cached client-side
- Overlay composes `Search:Bar` and relies on core `SearchWidgetPlugin` for suggest
- Suggest markup is rendered via theme UX components (`Search:Suggest*`)
- Close via close button, backdrop click, Escape, or toggling the action again
- Body scroll lock while open; focus returns to the action on close

## How it works

### Open flow

1. `ViewsTheme:Search:Action` reads `overlayUrl` from `data-component-options`
2. First click fetches `frontend.views-theme.search.overlay`
3. Response HTML is appended to `document.body`
4. Shopware component system initializes `ViewsTheme:Search:Overlay`
5. `PluginManager.initializePluginsInParentElement` boots `SearchWidgetPlugin` on the bar form
6. Subsequent clicks toggle the existing overlay instance (no extra network request)

### Suggest flow

`Search:Bar` keeps core hooks (`data-search-widget`, `.js-search-form`, suggest URL).  
Typing hits `frontend.search.suggest`. The storefront override  
`layout/header/search-suggest.html.twig` renders `<twig:ViewsTheme:Search:Suggest />`.

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.search.overlay` | `/widgets/search/overlay` | `GET` (XHR) |

Optional query params:

| Param | Purpose |
|-------|---------|
| `search` | Prefill bar value |
| `minSearchLength` | Override min chars for suggest |

Props are applied **server-side** when rendering the UX component. Client JS cannot pass Twig props after fetch; use query params or `data-component-options` for runtime options.

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
| Suggest wire | `src/Resources/views/storefront/layout/header/search-suggest.html.twig` |
| SCSS | `src/Resources/app/storefront/src/scss/component/search.scss` |
