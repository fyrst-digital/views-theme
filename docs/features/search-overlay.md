# Search overlay

Lazy-loaded full-viewport search dialog opened from the header search action.

All UI lives under UX components (`components/Search/*`). Markup is served by theme routes under `/vi/…` — no storefront template overrides for search.

## Features

- Header `Search:Action` opens `Search:Overlay` on click
- Overlay shell lifecycle (hard rule): **(re)fetch on every open**, **remove from DOM when close finishes** — never cache HTML or keep a closed mount (see [JS conventions](../conventions/javascript.md#lazy-loaded-shells-critical))
- Term hand-off is **event-only**: Close payload `{ el, term }` → Action stores string → `overlay.open({ term })` → Open payload → Bar `setTerm` + suggest. Action never touches the input DOM
- Wide centered panel (command-palette style): search chrome + in-panel product list + “View all” footer
- `Search:Bar` owns suggest UX (debounce, fetch, DOM insert) — **not** core `SearchWidgetPlugin`
- Suggest HTML is rendered by the theme controller via Symfony UX `ComponentRendererInterface` as `ViewsTheme:Search:Suggest` with explicit props
- Close via isolated `Search:Overlay:Close` / shared `Backdrop`, Escape, or toggling the action again
- Body scroll lock while open; focus returns to the action on close
- Open state traps Tab within the dialog

## Layout notes

- Styling is **Bootstrap utilities first** (in sibling `*.cva.twig`). Co-located component CSS (e.g. `Bar.css`, `Overlay.css`, `Scroll/Area.css`) is last resort only — no global `search.scss`.
- Overlay open/close toggles `d-none` / `d-flex` in `Overlay.js`.
- Close is nested under `Search/Overlay/`; backdrop uses shared `ViewsTheme:Backdrop`.
- Suggest is inserted as the **next sibling after the bar form**.
- Flex scroll chain: panel (`min-h-0` + column flex) → Suggest (`flex-1 min-h-0`) → Results/`Scroll:Area` (`flex-1 min-h-0`) so long result lists scroll inside the panel.
- Product rows (`Search:Suggest:Item`): compose `Product:Cover` (`showLink=false`), local manufacturer/category meta, `Product:Name` (`showLink=false`), and compact `Product:Price` (`showTieredPrices=false`, `showTaxNote=false`, list price via shared Price component).
- Suggest subcomponents (Heading, Results, Item, Summary, Empty) live nested under `Search/Suggest/`.
- Product results compose `ViewsTheme:Scroll:Area` (body → default `content` block). Fade styles live in co-located `Scroll/Area.css` (`.vi-scroll-area`, `--scroll-fade: 40px`); base overflow is `overflow-y-auto`; JS toggles `data-scroll-up` / `data-scroll-down` so fades hide at the corresponding edge (and when content does not overflow).

## How it works

### Open flow

1. `ViewsTheme:Search:Action` reads `overlayUrl` from `data-component-options`
2. If Overlay is already open → `close()` only (no fetch)
3. Otherwise **always** fetches `frontend.views-theme.search.overlay`
4. Response root is mounted on `document.body` (any leftover mount removed first)
5. Action waits for Overlay instance, then `overlay.open({ term: preservedTerm })` (Action does not touch the input)
6. Overlay opens chrome, waits for Bar, calls `Bar.onOpened(term)` (setTerm + suggest once), then `emitQueued` Open `{ el, term }` for Action aria, then `Bar.focusInput()`
7. Action sets `aria-expanded` on Open

### Close flow

1. Backdrop / Close `callMethod('ViewsTheme:Search:Overlay', 'close')`, or Escape
2. Overlay reads `Bar.getTerm()`, closes chrome, `emitQueued` Close `{ el, term }`
3. Action stores `term`, updates aria, focuses the trigger, **removes** the overlay root

### Suggest flow

`ViewsTheme:Search:Bar` (`Bar.js`):

1. Debounced `input` on the search field
2. If term length ≥ `minChars`, `GET` theme route with `search` query param
3. Abort previous in-flight request
4. Mount HTML **after the form**
5. Wire keyboard focus + analytics custom events
6. On Open with restored `term`, suggest runs immediately (no debounce)

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
| Backdrop | `data-component="ViewsTheme:Backdrop"` |
| Close | `data-component="ViewsTheme:Search:Overlay:Close"` |
| Search bar | `data-component="ViewsTheme:Search:Bar"` |
| Scroll area (results grid) | `data-component="ViewsTheme:Scroll:Area"` |
| View all | `data-action="view-all"` |

Bar options (`data-component-options`): `suggestUrl`, `minChars`, `delay`.

Events:

| Event | Payload |
|-------|---------|
| `ViewsTheme:Search:Overlay:Open` | `{ el, term }` |
| `ViewsTheme:Search:Overlay:Close` | `{ el, term }` |

See [JavaScript conventions](../conventions/javascript.md).

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/SearchOverlayController.php` |
| Overlay | `src/Resources/views/components/Search/Overlay.*` |
| Backdrop (shared) | `src/Resources/views/components/Backdrop.*` |
| Close | `src/Resources/views/components/Search/Overlay/Close.*` |
| Action | `src/Resources/views/components/Search/Action.*` |
| Bar | `src/Resources/views/components/Search/Bar.*` |
| Suggest | `src/Resources/views/components/Search/Suggest.*` |
| Suggest children | `src/Resources/views/components/Search/Suggest/{Heading,Results,Item,Summary,Empty}.*` |
| Scroll area | `src/Resources/views/components/Scroll/Area.*` |
| Product pieces used by suggest | `src/Resources/views/components/Product/Cover.html.twig`, `Name.html.twig`, `Price.html.twig` |
