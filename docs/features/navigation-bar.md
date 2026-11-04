# Navigation bar and flyout

Desktop top-level category bar with lazy mega-menu flyouts. Complements the [Navigation drawer](navigation-drawer.md) (mobile / menu action).

All UI lives under UX components (`components/Navigation/Bar*`, `components/Navigation/Flyout*`). Flyout markup is served by a theme route under `/vi/…`.

The header override replaces core `layout_header_navigation` content with `Page:Header:Main`, which composes the theme Bar from the header pagelet. Parent `storefront/layout/header.html.twig` empties core `base_navigation` (navbar) and `base_offcanvas_navigation` so only the theme Bar / Drawer own main nav.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Navigation:Bar` | Horizontal top-level list; hover/focus intent; fetch + insert flyouts; one flyout shown at a time (`showPopover` / `hidePopover`); in-session flyout DOM cache; active path; prop `widthAnchor` applied to inserted flyouts |
| `Navigation:Bar:Item` | Top-level link or folder button (`fw-semibold`, `fs-xxl-4` = 20px from `xxl`) + flyout trigger attrs (`aria-expanded` / `aria-controls` / `aria-haspopup`) + `caret-down` when children exist |
| `Navigation:Flyout` | Panel markup only, no JS (`popover="manual"`, mega grid layout, CSS open/close motion, a11y region) |
| `Navigation:Flyout:Column` | One first-level branch (heading + nested list) |
| `Navigation:Flyout:Item` | Nested category link/folder; recurses to max depth |
| `Navigation:Flyout:Teaser` | Category image teaser when default `category.media` is set |
| `Page:Header:Main` | Composes [Logo](logo.md), Bar and Actions. Bar from `navigation` prop (`d-lg+` via Bar CVA); prop `widthAnchor` (default `--vi-header-main`) → Bar. Root gap is `gap-3`, `gap-lg-10` from `lg`. Props `languages` / `currencies` forward to `Page:Header:Actions` (language and currency switches, lg+) |

## Features

- Top-level categories **SSR** with the header pagelet (Bar only — no flyout HTML on first paint)
- No home link in the bar
- Hover or keyboard focus on an item with children opens a lazily fetched flyout
- Items with children show a decorative `caret-down` after the label
- Leaf items navigate only (no flyout trigger, no caret)
- Folder top-level items use `<button type="button">` (no `href="#"`)
- Multi-row bar: path into the flyout may cross other triggers — pending open is cancelled on flyout enter; switching open flyouts uses a longer dwell (`switchDelay`)
- Mega layout uses **CSS multi-column** (`column-width`) for category groups (packs top→bottom; no equal-height row gaps)
- Optional teaser from default category media (`category.media`; core navbar parity)
- Tree depth from sales channel `navigationCategoryDepth` (bar = level 1; flyout = remaining levels; no flyout when depth ≤ 1); fallback **3** only if depth &lt; 1
- Close: pointer leaving the bar/flyout pair, or moving onto a leaf item or empty bar space (`closeDelay`); Escape; focus leaving the bar/flyout pair
- Only one flyout open; responses for a trigger the pointer has left are not shown
- `prefers-reduced-motion` skips open/close motion
- Below `lg`, Bar is hidden (`d-none d-lg-flex`); Drawer remains the small-viewport entry

## How it works

### Bar (SSR)

1. Header override passes `header.navigation` into `Page:Header:Main`
2. Main renders `Navigation:Bar` with the tree
3. Bar lists top-level items only (`navigation.tree`)
4. Items with children expose `data-flyout-trigger`, `data-flyout-url`, `data-navigation-id`, and ARIA attrs
5. Active styling from `window.activeNavigationId` / `window.activeNavigationPathIdList` → `data-active` on the trigger control
6. Dual CSS anchors: Bar `--vi-navigation-bar` (flyout top / hover path); Header:Main `--vi-header-main` (flyout left/right width)

### Intent

Every pointer / focus event resolves to one **intended** trigger (or none), and a single timer moves the shown flyout there:

| Event | Intent |
|-------|--------|
| `pointerover` the shown flyout (incl. hover bridge) | Keep it: cancels a pending switch / close |
| `pointerover` / `focusin` a trigger | That trigger |
| `pointerover` anything else in the bar (leaf item, empty list / nav space) | None |
| `pointerleave` the bar | None |
| `focusout` to outside the bar (ignored while the bar is hovered) | None |

| Change | Delay |
|--------|-------|
| First open (nothing shown) | `debounceTime` (default 150ms) |
| Switch (another flyout shown) | `switchDelay` (default 350ms), so a multi-row path into the panel does not steal it |
| Close | `closeDelay` (default 200ms) |
| Back to the shown trigger / flyout | None: pending timer cancelled |

The Bar listens to bubbling `pointerover`, not `pointerenter`: moving from an item onto the bar's own empty space fires no `pointerenter`. Escape closes immediately and returns focus to the trigger when focus was inside the bar.

### Flyout show / hide

1. When the timer fires, the shown flyout (if any) gets `hidePopover()` and its trigger `aria-expanded="false"`
2. The target flyout comes from the Bar cache, or is fetched from `frontend.views-theme.navigation.flyout`
3. A fetched root is inserted **right after its trigger** inside the `<li>`, hidden (`popover="manual"`), with `--vi-flyout-width-anchor` set from `widthAnchor`. Tab order is trigger → flyout links → next trigger
4. If the intent is still that trigger, the Bar calls `showPopover()` and sets `aria-expanded="true"`
5. Open and close motion are CSS only (`@starting-style`, `display` / `overlay` `allow-discrete`). Nothing waits for the transition, and closed flyouts stay in the DOM

There are no Flyout events and no Flyout component instance: the Bar holds the elements directly.

### Lazy-load / cache policy

**Exception** to [lazy-loaded shells](../conventions/javascript.md#lazy-loaded-shells-critical) (Drawer / Search Overlay always refetch and never cache):

| Rule | v1 |
|------|-----|
| Fetch | Per category when that flyout is first requested |
| Cache | In-session map on Bar: trigger → promise of the inserted flyout element (`null` for `204`) |
| Lifetime | Page lifetime only — no `sessionStorage` / `localStorage` |
| DOM | Closed flyouts stay inserted, hidden (`display: none`); reopen only calls `showPopover()` |
| Failures | Failed fetch is dropped from the cache, so the next hover retries |
| Races | No abort: a resolved flyout is shown only if it is still the intended one |

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

Renders `ViewsTheme:Navigation:Flyout` via `ComponentRendererInterface`. Empty tree → `204`. `navigationId` must be a 32-char hex id (route requirement), so arbitrary strings 404 instead of filling the HTTP cache.

HTTP-cached (`_httpCache`), so a Bar in-session cache miss after a reload is a server cache hit. See [architecture — HTTP cache](../architecture.md#http-cache-_httpcache).

## Hooks

| Hook | Attribute |
|------|-----------|
| Bar | `data-component="ViewsTheme:Navigation:Bar"` |
| Flyout anchors | Bar `anchor-name: --vi-navigation-bar`; Main `anchor-name: --vi-header-main` |
| Item trigger | `data-flyout-trigger` + `data-flyout-url` + `data-navigation-id` |
| Active trigger | `data-active="true"` (set by Bar JS) |
| Flyout root | `#vi-navigation-flyout-{id}` / `popover="manual"`, inserted after its trigger (no `data-component`: Bar owns it) |
| Flyout width | Bar option / prop `widthAnchor` → mount sets `--vi-flyout-width-anchor` (Flyout SSR default `--vi-navigation-bar`; Header:Main default `--vi-header-main`) |

Bar options (`data-component-options` defaults in JS): `debounceTime`, `switchDelay`, `closeDelay`, `widthAnchor` (default `--vi-navigation-bar`; Header:Main passes `--vi-header-main`).

## Layout notes

- **Bootstrap utilities first (CVA).** Co-located CSS only for what utilities cannot express.
- **Header:Main CSS:** `anchor-name: --vi-header-main` (flyout horizontal edges).
- **Bar CSS:** `anchor-name: --vi-navigation-bar` (flyout top) + button `appearance: none` (folder triggers). Active weight via JS `fw-semibold` (with `data-active`).
- **Flyout chrome** (`bg-body`, `shadow`, `rounded-3`, `p-4`, `border-0`, `m-0`) in `Flyout.cva.twig` — same split as [Dropdown](../conventions/javascript.md#dropdown).
- **Flyout CSS:** popover + dual anchor + open motion + hover-bridge `::before`; columns multi-column (`column-width` / `column-gap`); column groups `break-inside: avoid` + block-end margin; teaser `aspect-ratio` only.
- **Flyout layout CVA:** root is chrome only + `--teaser` variant; `body` (wraps the `content` block) `d-flex flex-wrap flex-row gap-10 align-items-start`; `columns` `col min-w-0 column-gap-8`; Column `mb-8`; teaser `col-auto`.
- Flyout is HTML **Popover** (`popover="manual"`) + CSS **anchor positioning** (hover intent stays JS-owned, so not `popover="auto"` / `popovertarget`).
- Placement: `position-anchor: --vi-navigation-bar`; `top: calc(anchor(bottom) + offset)`; `left`/`right: anchor(var(--vi-flyout-width-anchor, --vi-navigation-bar) …)`. Width from Bar `widthAnchor` (Header:Main default `--vi-header-main` = logo → actions); top under Bar so the hover bridge spans only the offset gap. Override: `widthAnchor="--vi-navigation-bar"` on Main/Bar, or any page `anchor-name`.
- Open state: `:popover-open` + `@starting-style` / `allow-discrete`; `showPopover` / `hidePopover` from Bar JS.
- **No display utility on the popover root.** Bootstrap `d-*` is `!important` and beats the UA `display: none` of a closed popover, so closed flyouts (which stay in the DOM) would remain rendered and tabbable. Layout goes on `body`.
- Motion: CSS only (`--vi-flyout-duration`); JS never waits for it. `prefers-reduced-motion: reduce` drops the transition.
- Type hierarchy: column **heading** `text-body fw-semibold` + BS link-underline hover; child links `link-secondary` + link-underline hover.
- Teaser: `rounded-3 overflow-hidden` + image `object-fit-cover` (CVA); not CMS promo blocks.
- Tokens (component CSS reads only; theme may override): `--vi-flyout-offset` (top gap **and** hover-bridge height), `--vi-flyout-duration`, `--vi-column-min`, `--vi-image-max-w`, `--vi-image-ar`. Column gap is CVA `column-gap-8` / Column `mb-8`. Width anchor token `--vi-flyout-width-anchor` is set by the Flyout prop / Bar mount (not theme CSS). Everything else via CVA / `class`.

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/NavigationFlyoutController.php` |
| Bar | `src/Resources/views/components/Navigation/Bar.*` |
| Bar item | `src/Resources/views/components/Navigation/Bar/Item.*` |
| Flyout shell | `src/Resources/views/components/Navigation/Flyout.*` |
| Column / Item / Teaser | `src/Resources/views/components/Navigation/Flyout/{Column,Item,Teaser}.*` |
| Header wire-up | `Page/Header/Main.html.twig`, `storefront/layout/header/header.html.twig` |
| Core nav suppress | `storefront/layout/header.html.twig` (empty `base_navigation`, `base_offcanvas_navigation`) |

## Out of scope (v1)

- Restoring or dual-running core desktop main-nav markup alongside the theme Bar
- Redesigning `Navigation:Drawer`
- CMS / promo blocks beyond category image teaser
- Touch-first flyout as primary mobile nav
- Persisted flyout HTML across reloads
- Home link in the bar
- Per-item anchored mini-menus (Header:Main full-width only)

## Related

- [Logo](logo.md)
- [Navigation drawer](navigation-drawer.md)
- [JavaScript conventions](../conventions/javascript.md)
- [Architecture](../architecture.md)
