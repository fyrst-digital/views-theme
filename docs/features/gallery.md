# Gallery

PDP / CMS media gallery (images + video). Scroll-snap canvas synced with a thumbnail strip, prev/next controls, and dots. Optional lazy-loaded fullscreen modal.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Gallery` | Owner JS: seeds the gallery store (`index` / `count` / `rewind`) from its options, ArrowKey navigation, `select` / `prev` / `next` / `getIndex` façade, `ViewsTheme:Gallery:Change` emitter; drops the store in `destroy` |
| `Gallery:Thumbnails` | Strip shell; follows the store `index` → `scrollToIndex` keeps active thumb visible (rect math + clamp); composes `Scroll:Area` as scrollport (edge fades) + `__list` flex row/column |
| `Gallery:Thumb` | Binds itself to the store: click selects its `index`, `aria-current` follows `index`; video = poster only + play badge |
| `Gallery:Canvas` | Scroll-snap track; follows the store `index` (`goTo` via `scrollIntoView`); settle via `getBoundingClientRect` writes the store only on user scroll; resize re-pins current index (`behavior: 'instant'`); optional fullscreen action slot |
| `Gallery:Slide` | One media slide; pauses its own videos while not the active index; image via `sw_thumbnails`, video via Storefront `utilities/video.html.twig` |
| `Gallery:Control` | Prev/next → `step(galleryId, direction)`; `disabled` / `aria-disabled` follow `index` + `count` + `rewind` |
| `Gallery:Dots` / `Gallery:Dot` | Dot nav; same store binding as thumbs |
| `Gallery:Action:Fullscreen` | Lazy shell owner (multi-instance): fetch/mount/unmount `Gallery:Fullscreen` through the shell registry (`shellId`); open with media `ids` + the parent store index; on close `select(galleryId, detail.index)` restores **own** parent index. Only the Action that mounted (`_owns`) reacts; a new Action closes the current shell first |
| `Gallery:Fullscreen` | Dialog shell (body lock, Escape, Tab trap); registers as `vi-gallery-fullscreen`; composes nested `Gallery` with its **own** `galleryId` (`vi-gallery-fullscreen-gallery`, `mode="fullscreen"`, `fullscreen=false`); reports the nested index as close `detail` |
| `Gallery:Fullscreen:Close` | Close control → `Fullscreen.close` |

## Composition

```
Gallery (data-component owner)
├─ Gallery:Thumbnails          (only when medias|length > 1)
│    └─ Scroll:Area            (scrollport + axis-correct edge fades; track BEM)
│         └─ __list            (flex; center via auto margins when thumbnailAlign=center)
│              └─ Gallery:Thumb × N
└─ Gallery:Canvas
     ├─ track
     │    └─ Gallery:Slide × N
     ├─ Gallery:Control prev/next   (multi only)
     ├─ Gallery:Action:Fullscreen   (when fullscreen + media ids)
     └─ Gallery:Dots                (multi only)
          └─ Gallery:Dot × N
```

Fullscreen shell (body mount):

```
Gallery:Fullscreen
├─ Backdrop
├─ Gallery:Fullscreen:Close
└─ panel
     └─ Gallery (mode=fullscreen, fullscreen=false, controlsOnHover=false, thumbnailAlign=center)
```

```twig
<twig:ViewsTheme:Gallery :medias="mediaItems" :active="0" :fullscreen="true" />
```

## Props

| Component | Prop | Role |
|-----------|------|------|
| `Gallery` | `medias` | Media entities (flat list; image + VIDEO) |
| `Gallery` | `active` | 0-based initial index (SSR + JS hydrate) |
| `Gallery` | `rewind` | When `true` (default), next on last → first and prev on first → last; controls stay enabled. `false` = clamp + disable at ends |
| `Gallery` | `controlsOnHover` | When `true` (default), canvas prev/next **and** fullscreen action hidden until canvas hover or control/fullscreen `:focus-visible`. `false` = always visible. Touch / coarse pointer: always visible. Not `:focus-within` — mouse click focus must not stick controls open |
| `Gallery` | `fullscreen` | When `true` and medias have ids, render canvas fullscreen action (default `false`). Nested fullscreen shell always passes `false` |
| `Gallery` | `mode` | Layout variant: `default` (content-height, AR-driven slides) or `fullscreen` (height-fill panel; media `object-fit: contain`). Sets `data-mode`. Independent of boolean `fullscreen` |
| `Gallery` | `galleryId` | Store key, rendered by Twig (default `'vi-gallery-' ~ random()`); threaded to Thumbnails, Canvas, Slide, Control, Dots, Dot, Action. Never discovered through the DOM |
| `Gallery` | `thumbnailAlign` | Thumb strip group align: `start` (default) or `center`. Sets `data-thumbnail-align`. When `center`, list uses auto margins (centers when content fits; collapses when overflowing so scroll stays reachable). Nested fullscreen shell always passes `center` |
| `Gallery:Thumb` / `Dot` | `index`, `active`, `total`, `galleryId` | Position + SSR `aria-current` (JS keeps it in sync) |
| `Gallery:Control` | `direction`, `disabled`, `galleryId` | `prev` \| `next`; clamp ends unless `rewind` |
| `Gallery:Canvas` | `multi` | When false, omit controls + dots |
| `Gallery:Canvas` | `rewind` | SSR control `disabled` when false at ends |
| `Gallery:Canvas` | `controlsOnHover` | Sets `data-controls-on-hover`; CSS-only show/hide of `.vi-gallery-canvas__controls` and `.vi-gallery-canvas__fullscreen` |
| `Gallery:Canvas` | `fullscreen` | When true, top-right `Gallery:Action:Fullscreen` with media ids |
| `Gallery:Action:Fullscreen` | `ids`, `galleryId` | Ordered media UUIDs for XHR load; parent store key |
| `Gallery:Fullscreen` | `medias`, `active`, `galleryId` | Passed through to nested `Gallery` (`mode=fullscreen`, `thumbnailAlign=center`, …) |

## JS API

State lives in `modules/gallery/store.js`: `galleries.get(galleryId)` → `{ index, count, rewind }` signals (keyed store, one per gallery; several galleries and the nested fullscreen gallery never share state). Parts read with `effect(index, fn)` and write with `select(id, index)` / `step(id, 'prev' | 'next')` (clamped; wrap when `rewind`). `Gallery` drops the store in `destroy`.

| API | Role |
|-----|------|
| `select(galleryId, index)` | Module function: clamp + set `index`; every bound part reacts (canvas scroll, thumbs/dots `aria-current`, controls, slide video pause) |
| `step(galleryId, direction)` | Module function: prev/next; wrap when `rewind`, otherwise clamp |
| `Gallery#select(index)` / `prev()` / `next()` / `getIndex()` | Thin façade over the store for external `callMethod` callers |
| ArrowLeft/Up · ArrowRight/Down | When focus is inside gallery (not on `input` / `textarea` / `select` / `video` / contenteditable) → `prev` / `next` |
| `ViewsTheme:Gallery:Change` | `{ el, index }` on every `index` change after init (incl. a restore from fullscreen) |
| `Gallery:Action:Fullscreen` `open()` / `close()` | Lazy shell lifecycle |
| `ViewsTheme:Gallery:Fullscreen:Open` | `{ el, index }` |
| `ViewsTheme:Gallery:Fullscreen:Close` | `{ el, index }` — Action restores parent gallery index + unmounts |

Discovery uses `[data-component="ViewsTheme:Gallery:…"]` — never CSS classes.

Children never resolve the owner through `closest` + `getInstanceByElement`: they share the store through `galleryId`, so nested fullscreen galleries cannot cross-talk.

Canvas settle: `scrollend` clears the programmatic gate (timeout is fallback only) so a user swipe during smooth `goTo` still updates chrome.

## Fullscreen flow

1. `Gallery:Action:Fullscreen` reads `overlayUrl` + `ids` from options
2. Click / `open()` → if another gallery’s shell is live, **close it first** (its owner restores index + unmounts)
3. `GET frontend.views-theme.gallery.fullscreen?ids[]=…&active=N` (N = parent store `index`)
4. `mountShell('vi-gallery-fullscreen', html)`; the Action sets `_owns`. Empty body / **204** (no medias) → no mount
5. Action `open()`s the shell (body lock, aria, focus close)
6. The nested `Gallery` (own store) is the media SoT inside the dialog
7. Close (button / backdrop / Escape) → `setShellOpen(id, false, { index })` → **only** the owning Action restores the parent store (`select(galleryId, index)`), returns focus, `releaseShell`s

Multi-instance: every Action subscribes to `shell('vi-gallery-fullscreen').open`; non-owners no-op. Toggle-on-click closes only the Action’s own shell.

Singleton shell id: fixed `id="vi-gallery-fullscreen"` (one body-mounted shell at a time). Every Action’s `aria-controls` points at that id.

Shell lifecycle (hard rule): **(re)fetch on every open**, **remove from DOM when close finishes** — see [JS conventions](../conventions/javascript.md#lazy-loaded-shells-critical).

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.gallery.fullscreen` | `/vi/gallery/fullscreen` | `GET` (XHR) |

Loads public media via `AbstractMediaRoute` / `MediaRoute`, re-orders to match requested ids, renders `ViewsTheme:Gallery:Fullscreen`.

Input: only valid UUIDs; max **50** ids (extra dropped). Invalid ids are ignored (no DAL errors). No resolvable medias → **204** empty body (Action does not mount).

## Media types

Detection: `media.getMediaType().getName() === 'VIDEO'` (same as product cover). Null and spatial objects are **filtered out of `medias` at Gallery root** (no empty snap cells); Slide/Thumb keep a defensive `isSpatialObject` guard.

| Surface | IMAGE | VIDEO |
|---------|-------|-------|
| `Gallery:Slide` | `{% sw_thumbnails %}` → `.vi-gallery-slide__image` | Storefront `utilities/video.html.twig` with native `controls` → `.vi-gallery-slide__video` (no autoplay) |
| `Gallery:Thumb` | `{% sw_thumbnails %}` → `.vi-gallery-thumb__image` | **Poster only** — never `<video>` in the strip |

### Video thumbs (poster only)

| Case | Render |
|------|--------|
| `media.extensions.videoCoverMedia` set | `sw_thumbnails` on cover → `.vi-gallery-thumb__image` |
| No cover | Empty `.vi-gallery-thumb__poster` shell (same box size) |
| Always (VIDEO) | Decorative `.vi-gallery-thumb__play` badge (`aria-hidden`) |

Slide video poster/preload comes from the Storefront utility when `videoCoverMedia` is present (`#t=0.001` first-frame fallback otherwise).

### Video playback

| Concern | Behavior |
|---------|----------|
| Start | User presses native controls on the active slide |
| Leave slide / `select` / `setIndex` | Owner pauses every slide `video` that is not the active index |
| `destroy` | Pause all gallery videos |

### Active state

| Concern | SoT |
|---------|-----|
| Active index | Gallery store (`galleries.get(galleryId).index`) |
| Active thumb / dot | `aria-current` — CSS keys off attribute |
| Control ends | `disabled` + `aria-disabled` |
| Canvas position | scroll-snap; `goTo` via `scrollIntoView` (element target); `scrollend` clears programmatic settle gate; `prefers-reduced-motion: reduce` → CSS `scroll-behavior: auto` + JS `behavior: 'auto'` on canvas/thumbs |

## CSS / sizing

| Concern | SoT |
|---------|-----|
| Slide size | Media: `inline-size: 100%`, `block-size: var(--vi-media-h, auto)`; shell `block-size: var(--vi-slide-h, auto)` |
| Thumb size | `.vi-gallery-thumb__image` **and** `.vi-gallery-thumb__poster` — `inline-size: var(--vi-thumb-size, 64px)`, `block-size: auto` (button has no fixed box size) |
| Aspect ratio | Slide media: `var(--vi-media-ar, var(--vi-image-ar, 4 / 3))`; thumb: `var(--vi-image-ar, 1 / 1)`. Theme may set shared `--vi-image-ar`; fullscreen sets **only** `--vi-media-ar` so thumbs keep their box |
| Layout | Host CVA: `d-grid gap-3 gap-md-4`; `mode=fullscreen` → `p-4 h-100 overflow-hidden`. CSS tokens for `cols` / `rows` / `areas` / heights only |
| Canvas track | `.vi-gallery-canvas__track` — `display: grid`, `grid-auto-flow: column`, `grid-auto-columns: 100%`; `gap: var(--vi-canvas-gap, 1px)` anti-bleed between snap cells; `block-size: var(--vi-track-h, auto)` |
| `mode=default` | Content-height: token fallbacks only (no host assigns) |
| `mode=fullscreen` | CVA variant for padding/height/overflow. Host **assigns** geometry tokens only (`--vi-min-h`, `--vi-rows`, `--vi-media-ar` / `--vi-media-fit`, `--vi-*-h`, thumbs height). Never assigns shared `--vi-image-ar` / `--vi-image-fit` (thumbs consume those). No property re-declarations, no descendant selectors |
| Orientation breakpoint | **Only** `Gallery.css` nested `@media (min-width: 768px)` — **assigns** track/height/snap tokens on multi host. Thumb direction is CVA `flex-md-column` |
| Named areas | `.vi-gallery-canvas` → `canvas`; `.vi-gallery-thumbnails` → `thumbs` |
| Single image | `data-multi="false"` — no thumbs/controls/dots; full-width canvas; fullscreen action still allowed |
| Controls on hover | Canvas `data-controls-on-hover="true"` — hide `.vi-gallery-canvas__controls` and `.vi-gallery-canvas__fullscreen` until `:hover` or `:has(.vi-gallery-control:focus-visible)` / `:has(.vi-gallery-action-fullscreen:focus-visible)`; only under `@media (hover: hover) and (pointer: fine)`; fade `var(--vi-control-fade-duration, 150ms)` |
| Fullscreen action | Canvas top-right (`.vi-gallery-canvas__fullscreen`); control-sized circular button; same hover-gate as prev/next when `controlsOnHover` |
| Control chrome | Shared circular button SoT in `Control.css` (`.vi-gallery-control`, `.vi-gallery-action-fullscreen`, `.vi-gallery-fullscreen-close`); Close adds position only |
| Fullscreen shell | Fixed inset, minimal viewport padding (`p-2` / `p-md-3`); panel fills remaining space; singleton `#vi-gallery-fullscreen` |

### Host tokens (init on base / consume in children; assign on variants)

Defaults: under + horizontal track; from `md+` start + vertical track + height lock. Theme may assign any token on the gallery host.

| Token | Default (var fallback) | Multi | `md+` multi assign | `mode=fullscreen` assign |
|-------|------------------------|-------|--------------------|--------------------------|
| `--vi-min-h` | `auto` | — | — | `0` |
| `--vi-cols` | `minmax(0, 1fr)` | — | `var(--vi-thumbs-w, auto) minmax(0, 1fr)` | — |
| `--vi-rows` | `none` | — | — | multi: `minmax(0, 1fr) auto` (md: `minmax(0, 1fr)`); single: `minmax(0, 1fr)` |
| `--vi-areas` | `none` | `'canvas' 'thumbs'` | `'thumbs canvas'` | — |
| `--vi-thumbs-w` | — | — | used inside `--vi-cols` (`auto`) | — |
| `--vi-thumbs-snap` | `x mandatory` (Thumbnails) | — | `y mandatory` | — |
| `--vi-thumb-snap-align` | `start` (Thumb) | — | — | —; `thumbnailAlign=center` assigns `center` |
| `--vi-thumbs-h` / `--vi-thumbs-min-h` | `auto` / `0` | — | `0` / `100%` | `auto` / `0` (md multi: h `100%`) |
| `--vi-thumbs-track-h` | `auto` | — | `100%` | — |
| `--vi-canvas-h` / `--vi-track-h` / `--vi-slide-h` / `--vi-media-h` | `auto` | — | — | `100%` |
| `--vi-track-rows` | `auto` (Canvas track `grid-auto-rows`) | — | — | `minmax(0, 100%)` — definite row so slide/media `%` heights resolve |
| `--vi-image-ar` | slide `4 / 3` via chain; thumb `1 / 1` | — | — | **unset** (thumbs must keep box) |
| `--vi-image-fit` | slide image `fill` / video `contain` via chain; thumb `cover` | — | — | **unset** (thumbs keep `cover`) |
| `--vi-media-ar` / `--vi-media-fit` | fall through to `--vi-image-*` | — | — | `auto` / `contain` (slide canvas only) |

`Thumbnails.css` / `Canvas.css` / `Slide.css` only **consume** height and media tokens. Host never re-declares those properties on variants.

Thumb track is `Scroll:Area` (`.vi-gallery-thumbnails__track` + `.vi-scroll-area`) with inner `.vi-gallery-thumbnails__list` (CVA `d-flex flex-row flex-md-column gap-2`; `align=center` → `mx-auto my-auto`). Edge fades via `data-scroll-up|down|start|end` → `--fade-*` (eased, `var(--vi-fade, 40px)` / `var(--vi-fade-duration, 200ms)`); horizontal edges use `Math.abs(scrollLeft)` (Firefox RTL). `scrollToIndex` uses `getBoundingClientRect` + clamp; axis from computed `flex-direction` (`flex-md-column` at `md`).

## CMS bridge

| File | Role |
|------|------|
| `storefront/element/cms-element-image-gallery.html.twig` | Maps `element.data.sliderItems[].media` → `:medias`; core 1-based `startIndexSlider` → 0-based `:active`; `:fullscreen="true"` |

Default PDP layout: `cms-block-gallery-buybox` left slot (unchanged).

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/GalleryFullscreenController.php` |
| Gallery owner | `src/Resources/views/components/Gallery.*` |
| Gallery store | `src/Resources/app/storefront/src/modules/gallery/store.js` |
| Canvas / controls | `src/Resources/views/components/Gallery/{Canvas,Control,Slide,Thumb,Thumbnails,Dots,Dot}.*` |
| Fullscreen action | `src/Resources/views/components/Gallery/Action/Fullscreen.*` |
| Fullscreen shell | `src/Resources/views/components/Gallery/Fullscreen.*` |
| Close | `src/Resources/views/components/Gallery/Fullscreen/Close.*` |
| Backdrop (shared) | `src/Resources/views/components/Backdrop.*` |

## Out of scope (this feature)

- Magnifier / zoom-on-hover
- Spatial / AR media branches
- Thumb `<video>` previews / autoplay
- Full CMS config surface (`galleryPosition`, arrow/dot placement enums, zoom flags)
- Native browser Fullscreen API

## Related

- [Tabs](tabs.md) — same owner + identity-child pattern
- [Buy container](buy-container.md) — buy column beside gallery
- [Search overlay](search-overlay.md) — lazy shell lifecycle pattern
- [JavaScript](../conventions/javascript.md)
