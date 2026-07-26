# Navigation bar and flyout

Desktop top-level category bar with lazy mega-menu flyouts. Complements the [Navigation drawer](navigation-drawer.md) (mobile / menu action).

All UI lives under UX components (`components/Navigation/Bar*`, `components/Navigation/Flyout*`). Flyout markup is served by a theme route under `/vi/…`.

The header override replaces core `layout_header_navigation` content with `Page:Header:Main`, which composes the theme Bar from the header pagelet. Core main-nav markup is not rendered in that block.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Navigation:Bar` | Horizontal top-level list; hover/focus intent; one flyout at a time; in-session HTML cache; active path; listens to Flyout Open/Close |
| `Navigation:Bar:Item` | Top-level link or folder button + flyout trigger attrs (`aria-expanded` / `aria-controls` / `aria-haspopup`) + `caret-down` when children exist |
| `Navigation:Flyout` | Panel shell (`popover="manual"`, mega grid layout, open/close motion, a11y region); `emitQueued` Open/Close |
| `Navigation:Flyout:Column` | One first-level branch (heading + nested list) |
| `Navigation:Flyout:Item` | Nested category link/folder; recurses to max depth |
| `Navigation:Flyout:Teaser` | Category image teaser when default `category.media` is set |
| `Page:Header:Main` | Composes Bar from `navigation` prop (`d-lg+` via Bar CVA) |

## Features

- Top-level categories **SSR** with the header pagelet (Bar only — no flyout HTML on first paint)
- No home link in the bar
- Hover or keyboard focus on an item with children opens a lazily fetched flyout
- Items with children show a decorative `caret-down` after the label
- Leaf items navigate only (no flyout trigger, no caret)
- Folder top-level items use `<button type="button">` (no `href="#"`)
- Multi-row bar: path into the flyout may cross other triggers — pending open is cancelled on flyout enter; switching open flyouts uses a longer dwell (`switchDelay`)
- Mega layout uses **CSS grid** for structure (not flexbox as the grid system)
- Optional teaser from default category media (`category.media`; core navbar parity)
- Tree depth from sales channel `navigationCategoryDepth` (bar = level 1; flyout = remaining levels; no flyout when depth ≤ 1); fallback **3** only if depth &lt; 1
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
6. Bar root sets CSS `anchor-name: --vi-navigation-bar` (no empty mount host)

### Flyout open

1. `Navigation:Bar` schedules hover/focus intent on a trigger:
   - **First open** (no flyout mounted): `debounceTime` (default 150ms)
   - **Switch** (another item while a flyout is open): `switchDelay` (default 350ms) so a multi-row path into the panel does not steal the open category
2. Pointer enter on non-trigger chrome inside the bar (open panel / list gap) **clears** any pending open timer
3. Fetches `frontend.views-theme.navigation.flyout` for that `navigationId` (or serves in-session cache)
4. Empty (`204` / blank) or failed fetch → resets trigger ARIA; no mount
5. Appends response root as last child of Bar (`popover="manual"`)
6. Waits for `ViewsTheme:Navigation:Flyout` instance → `open()` → `showPopover()`
7. Flyout `emitQueued` `ViewsTheme:Navigation:Flyout:Open` `{ el }`
8. Bar keeps trigger `aria-expanded="true"`

### Flyout close

1. Leave delay / Escape / focus out → Bar calls `flyout.close()`
2. Flyout `hidePopover()` + close motion (or instant if reduced motion)
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

### Category teaser image

| Piece | Detail |
|-------|--------|
| Source | Default category media (`category.media`) on the flyout root (bar item) |
| Load | Associated by navigation loader (`media` association) — no custom field / `searchMedia` |
| Render | `Flyout:Teaser` when media present |

Drawer list thumbs still use custom field `vi_navigation_image` (separate concern).

### Depth

Sales channel `navigationCategoryDepth` counts levels from the main navigation root. The bar is level **1**; the flyout shows only the **remaining** levels under a bar item.

| SC depth | Bar | Flyout levels under bar item |
|----------|-----|------------------------------|
| **≤ 1** | Items only — no caret, no flyout trigger | None (`204` if fetched) |
| **2** | Flyout when category has children | **1** (direct children only) |
| **3** | Flyout when category has children | **2** (child + nested child) |
| **N** | Flyout when category has children | **N − 1** |

| Piece | Value |
|-------|--------|
| Source | `SalesChannelEntity::getNavigationCategoryDepth()` |
| Fallback | `3` when depth &lt; 1 (misconfigured channel only) |
| `flyoutLevels` | `max(0, scDepth - 1)` |
| Loader depth | `max(0, flyoutLevels - 1)` — Shopware `loadLevels` loads `(depth + 1)` descendant levels for a root |
| Twig `maxDepth` | Same as loader depth (`Column`/`Item` recurse while `level < maxDepth`) |

Bar gates flyout with `navigationDepth > 1` (prop from header / `context.salesChannel.navigationCategoryDepth`), not only `visibleChildCount` (core still loads an extra level for counting).

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.navigation.flyout` | `/vi/navigation/flyout/{navigationId}` | `GET` (XHR) |

Renders `ViewsTheme:Navigation:Flyout` via `ComponentRendererInterface`. Empty tree → `204`.

## Hooks

| Hook | Attribute |
|------|-----------|
| Bar | `data-component="ViewsTheme:Navigation:Bar"` |
| Bar anchor | CSS `anchor-name: --vi-navigation-bar` on `.vi-navigation-bar` |
| Item trigger | `data-flyout-trigger` + `data-flyout-url` + `data-navigation-id` |
| Active trigger | `data-active="true"` (set by Bar JS) |
| Flyout root | `data-component="ViewsTheme:Navigation:Flyout"` / `#vi-navigation-flyout-{id}` / `popover="manual"` |

Bar options (`data-component-options` defaults in JS): `debounceTime`, `switchDelay`, `closeDelay`.

## Layout notes

- **Bootstrap utilities first (CVA).** Co-located CSS only for what utilities cannot express.
- **Bar CSS:** `anchor-name` + button `appearance: none` (folder triggers). Active weight via JS `fw-semibold` (with `data-active`).
- **Flyout chrome** (`bg-body`, `shadow`, `rounded-3`, `p-4`, `border-0`, `m-0`) in `Flyout.cva.twig` — same split as [Dropdown](../conventions/javascript.md#dropdown).
- **Flyout CSS:** popover + bar anchor + open motion + hover-bridge `::before`; custom grid tracks (`minmax` / `auto-fill`); teaser `aspect-ratio` only.
- **Flyout layout CVA:** root `d-grid gap-4 align-items-start` + `--teaser` variant; `columns` / `teaser` slots `min-w-0` (+ columns `d-grid gap-4`).
- Flyout is HTML **Popover** (`popover="manual"`) + CSS **anchor positioning** to the bar (hover intent stays JS-owned, so not `popover="auto"` / `popovertarget`).
- Placement: `position-anchor: --vi-navigation-bar`; `top: calc(anchor(bottom) + offset)`; `left`/`right: anchor(…)`. Full bar width, not per-item.
- Open state: `:popover-open` + `@starting-style` / `allow-discrete`; `showPopover` / `hidePopover` from Flyout JS.
- Type hierarchy: column **heading** `text-body fw-semibold` + BS link-underline hover; child links `link-secondary` + link-underline hover.
- Teaser: `rounded-3 overflow-hidden` + image `object-fit-cover` (CVA); not CMS promo blocks.
- Tokens (component CSS reads only; theme may override): `--vi-navigation-flyout-offset`, `--vi-navigation-flyout-duration`, `--vi-navigation-flyout-col-min`, `--vi-navigation-flyout-teaser-aspect-ratio`. Everything else via CVA / `class`.

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/NavigationFlyoutController.php` |
| Bar | `src/Resources/views/components/Navigation/Bar.*` |
| Bar item | `src/Resources/views/components/Navigation/Bar/Item.*` |
| Flyout shell | `src/Resources/views/components/Navigation/Flyout.*` |
| Column / Item / Teaser | `src/Resources/views/components/Navigation/Flyout/{Column,Item,Teaser}.*` |
| Header wire-up | `Page/Header/Main.html.twig`, `storefront/layout/header/header.html.twig` |

## Out of scope (v1)

- Restoring or dual-running core desktop main-nav markup alongside the theme Bar
- Redesigning `Navigation:Drawer`
- CMS / promo blocks beyond category image teaser
- Touch-first flyout as primary mobile nav
- Persisted flyout HTML across reloads
- Home link in the bar
- Per-item anchored mini-menus (bar-level full-width only)

## Related

- [Navigation drawer](navigation-drawer.md)
- [JavaScript conventions](../conventions/javascript.md)
- [Architecture](../architecture.md)
