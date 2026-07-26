# Navigation bar and flyout

Desktop top-level category bar with lazy mega-menu flyouts. Complements the [Navigation drawer](navigation-drawer.md) (mobile / menu action).

All UI lives under UX components (`components/Navigation/Bar*`, `components/Navigation/Flyout*`). Flyout markup is served by a theme route under `/vi/…`.

The header override replaces core `layout_header_navigation` content with `Page:Header:Main`, which composes the theme Bar from the header pagelet. Core main-nav markup is not rendered in that block.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Navigation:Bar` | Horizontal top-level list; hover/focus intent; one flyout at a time; in-session HTML cache; active path; listens to Flyout Open/Close |
| `Navigation:Bar:Item` | Top-level link or folder button + flyout trigger attrs (`aria-expanded` / `aria-controls` / `aria-haspopup`) when children exist |
| `Navigation:Flyout` | Panel shell (open/close motion, a11y region); `emitQueued` Open/Close |
| `Navigation:Flyout:Grid` | CSS **grid** mega layout (columns + optional teaser) |
| `Navigation:Flyout:Column` | One first-level branch (heading + nested list) |
| `Navigation:Flyout:Item` | Nested category link/folder; recurses to max depth |
| `Navigation:Flyout:Teaser` | Category image teaser when `vi_navigation_image` is set |
| `Page:Header:Main` | Composes Bar from `navigation` prop (`d-lg+` via Bar CVA) |

## Features

- Top-level categories **SSR** with the header pagelet (Bar only — no flyout HTML on first paint)
- No home link in the bar
- Hover or keyboard focus on an item with children opens a lazily fetched flyout
- Leaf items navigate only (no flyout trigger)
- Folder top-level items use `<button type="button">` (no `href="#"`)
- Mega layout uses **CSS grid** for structure (not flexbox as the grid system)
- Optional teaser from category custom field `vi_navigation_image` (same field as drawer)
- Tree depth from sales channel `navigationCategoryDepth`; fallback **3**
- Close: pointer leave (intent delay), Escape, focus leaving bar/flyout pair
- Only one flyout open; stale fetches aborted/ignored
- `prefers-reduced-motion` skips open/close motion
- Below `lg`, Bar is hidden (`d-none d-lg-flex`); Drawer remains the small-viewport entry

## How it works

### Bar (SSR)

1. Header override passes `header.navigation` into `Page:Header:Main`
2. Main renders `Navigation:Bar` with the tree
3. Bar lists top-level items only (`navigation.tree`)
4. Items with children expose `data-flyout-trigger`, `data-flyout-url`, `data-navigation-id`, and ARIA attrs
5. Active styling from `window.activeNavigationId` / `window.activeNavigationPathIdList` → `data-active` on the trigger control

### Flyout open

1. `Navigation:Bar` debounces hover/focus intent on a trigger
2. Fetches `frontend.views-theme.navigation.flyout` for that `navigationId` (or serves in-session cache)
3. Empty (`204` / blank) or failed fetch → resets trigger ARIA; no mount
4. Mounts response root into `[data-flyout-host]` under Bar
5. Waits for `ViewsTheme:Navigation:Flyout` instance → `open()`
6. Flyout `emitQueued` `ViewsTheme:Navigation:Flyout:Open` `{ el }`
7. Bar keeps trigger `aria-expanded="true"`

### Flyout close

1. Leave delay / Escape / focus out → Bar calls `flyout.close()`
2. Flyout runs close motion (or instant if reduced motion)
3. Flyout `emitQueued` `ViewsTheme:Navigation:Flyout:Close` `{ el }`
4. Bar filters with `contains(el)` → **unmounts** flyout DOM and clears trigger ARIA
5. HTML string remains in Bar `_cache` for the page lifetime

### Events

| Event | Payload | Role |
|-------|---------|------|
| `ViewsTheme:Navigation:Flyout:Open` | `{ el }` | Lifecycle; Bar may sync ARIA |
| `ViewsTheme:Navigation:Flyout:Close` | `{ el }` | Bar unmounts closed flyout |

Bar → Flyout API after mount uses `getComponentInstanceByElement` + `open()` / `close()` / `isOpen()` (same style as Drawer Action → Drawer).

### Lazy-load / cache policy

**Exception** to [lazy-loaded shells](../conventions/javascript.md#lazy-loaded-shells-critical) (Drawer / Search Overlay always refetch and never cache HTML):

| Rule | v1 |
|------|-----|
| Fetch | Per category when that flyout is first requested |
| Cache | In-session memory map on Bar, keyed by category id |
| Lifetime | Page lifetime only — no `sessionStorage` / `localStorage` |
| DOM | Closed flyout root is unmounted; reopen uses cache → remount |
| Races | `AbortController` + monotonic request id; ignore stale responses |

Same idea as Drawer Menu level cache, scoped to the Bar instance (full page).

### Category navigation image

| Piece | Detail |
|-------|--------|
| Custom field | `vi_navigation_image` on category (media UUID, translated) |
| Resolve | Flyout root collects id → `searchMedia` once |
| Render | `Flyout:Teaser` when media present |

### Depth

| Source | Value |
|--------|--------|
| Sales channel | `navigationCategoryDepth` (`SalesChannelEntity::getNavigationCategoryDepth()`) |
| Fallback | `3` when depth &lt; 1 |
| Loader | `NavigationLoaderInterface::load($id, $context, $id, $depth)` |

Twig recursion respects the same `maxDepth` prop.

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.navigation.flyout` | `/vi/navigation/flyout/{navigationId}` | `GET` (XHR) |

Renders `ViewsTheme:Navigation:Flyout` via `ComponentRendererInterface`. Empty tree → `204`.

## Hooks

| Hook | Attribute |
|------|-----------|
| Bar | `data-component="ViewsTheme:Navigation:Bar"` |
| Flyout host | `data-flyout-host` (under Bar) |
| Item trigger | `data-flyout-trigger` + `data-flyout-url` + `data-navigation-id` |
| Active trigger | `data-active="true"` (set by Bar JS) |
| Flyout root | `data-component="ViewsTheme:Navigation:Flyout"` / `#vi-navigation-flyout-{id}` |

Bar options (`data-component-options` defaults in JS): `debounceTime`, `closeDelay`.

## Layout notes

- Styling is Bootstrap utilities first (CVA). Co-located `Bar.css` / `Flyout.css` for positioning, grid, and motion only.
- Mega structure: `.vi-navigation-flyout-grid` / `__columns` use `display: grid`. Flex is OK inside cells for small alignment only.
- Tokens (component CSS reads only; theme may override): `--vi-navigation-flyout-duration`, `--vi-navigation-flyout-bg`, `--vi-navigation-flyout-shadow`, `--vi-navigation-flyout-padding`, `--vi-navigation-flyout-radius`, `--vi-navigation-flyout-gap`, `--vi-navigation-flyout-col-min`, `--vi-navigation-flyout-col-gap`, `--vi-navigation-flyout-teaser-fit`, `--vi-navigation-flyout-teaser-aspect-ratio`, `--vi-navigation-flyout-teaser-radius`.

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/NavigationFlyoutController.php` |
| Bar | `src/Resources/views/components/Navigation/Bar.*` |
| Bar item | `src/Resources/views/components/Navigation/Bar/Item.*` |
| Flyout shell | `src/Resources/views/components/Navigation/Flyout.*` |
| Grid / Column / Item / Teaser | `src/Resources/views/components/Navigation/Flyout/{Grid,Column,Item,Teaser}.*` |
| Header wire-up | `Page/Header/Main.html.twig`, `storefront/layout/header/header.html.twig` |

## Out of scope (v1)

- Restoring or dual-running core desktop main-nav markup alongside the theme Bar
- Redesigning `Navigation:Drawer`
- CMS / promo blocks beyond category image teaser
- Touch-first flyout as primary mobile nav
- Persisted flyout HTML across reloads
- Home link in the bar

## Related

- [Navigation drawer](navigation-drawer.md)
- [JavaScript conventions](../conventions/javascript.md)
- [Architecture](../architecture.md)
