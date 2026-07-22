# Search overlay

Lazy-loaded full-viewport search dialog opened from the header search action.

All UI lives under UX components (`components/Search/*`). Markup is served by theme routes under `/vi/…` — no storefront template overrides for search.

## Features

- Header `Search:Action` opens `Search:Overlay` on click
- Overlay HTML is fetched once from a dedicated theme widget and cached client-side
- Wide centered panel (command-palette style): search chrome + in-panel product list + “View all” footer
- `Search:Bar` owns suggest UX (debounce, fetch, DOM insert) — **not** core `SearchWidgetPlugin`
- Suggest HTML is rendered by the theme controller via Symfony UX `ComponentRendererInterface` as `ViewsTheme:Search:Suggest` with explicit props
- Close via isolated `Search:Overlay:Close` / `Search:Overlay:Backdrop`, Escape, or toggling the action again
- Body scroll lock while open; focus returns to the action on close
- Closed overlay uses `inert` (and `aria-hidden`) so focus cannot reach hidden UI; open state traps Tab within the dialog

## Layout notes

- Styling is **Bootstrap utilities first** (in sibling `*.cva.twig`). Co-located component CSS (e.g. `Bar.css`, `Overlay.css`, `Scroll/Area.css`) is last resort only — no global `search.scss`.
- Overlay open/close toggles `d-none` / `d-flex` in `Overlay.js`.
- Backdrop and Close are nested UX components under `Search/Overlay/`.
- Suggest is inserted as the **next sibling after the bar form**.
- Flex scroll chain: panel (`min-h-0` + column flex) → Suggest (`flex-1 min-h-0`) → Results/`Scroll:Area` (`flex-1 min-h-0`) so long result lists scroll inside the panel.
- Product rows (`Search:Suggest:Item`): compose `Product:Cover` (`showLink=false`), local manufacturer/category meta, `Product:Name` (`showLink=false`), and compact `Product:Price` (`showTieredPrices=false`, `showTaxNote=false`, list price via shared Price component).
- Suggest subcomponents (Heading, Results, Item, Summary, Empty) live nested under `Search/Suggest/`.
- Product results compose `ViewsTheme:Scroll:Area` (body → default `content` block). Fade styles live in co-located `Scroll/Area.css` (`.vi-scroll-area`, `--scroll-fade: 40px`); JS toggles `data-scroll-up` / `data-scroll-down` so fades hide at the corresponding edge (and when content does not overflow).

## How it works

### Open flow

1. `ViewsTheme:Search:Action` reads `overlayUrl` from `data-component-options`
2. First click fetches `frontend.views-theme.search.overlay`
3. Response HTML is appended to `document.body`
4. Shopware component system initializes `ViewsTheme:Search:Overlay` and nested `ViewsTheme:Search:Bar`
5. Overlay `open()` clears `inert`, emits `ViewsTheme:Search:Overlay:Open` via `Shopware.emitQueued` (payload: overlay element); Action sets `aria-expanded`
6. Subsequent clicks toggle the existing overlay instance via `getComponentInstanceByElement` + `open()` / `close()`

### Close flow

1. `Search:Overlay:Backdrop` / `Search:Overlay:Close` call `Shopware.callMethod('ViewsTheme:Search:Overlay', 'close')`
2. `Escape` also calls `close()`
3. Overlay sets `inert`, emits `ViewsTheme:Search:Overlay:Close` via `Shopware.emitQueued` (payload: overlay element); Action updates aria and restores focus
4. Input value and suggest DOM stay mounted while the overlay is closed (no click-outside teardown)

### Suggest flow

`ViewsTheme:Search:Bar` (`Bar.js`):

1. Debounced `input` on the search field
2. If term length ≥ `minChars`, `GET` theme route with `search` query param
3. Abort previous in-flight request
4. Mount HTML **after the form**
5. Wire keyboard focus + analytics custom events
6. On `Shopware` event `ViewsTheme:Search:Overlay:Open` (payload: overlay element), if the bar is inside that overlay, the input still has a term ≥ `minChars`, and results are missing (or detached), re-fetch suggest

```
frontend.views-theme.search.suggest
```

Controller loads `SuggestPageLoader`, dispatches `SuggestPageLoadedHook` (core parity), then renders:

```php
$this->components->createAndRender('ViewsTheme:Search:Suggest', [
    'searchResult' => $page->getSearchResult(),
    'searchTerm' => $page->getSearchTerm(),
]);
```

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.search.overlay` | `/vi/search/overlay` | `GET` (XHR) |
| `frontend.views-theme.search.suggest` | `/vi/search/suggest` | `GET` (XHR) |

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
