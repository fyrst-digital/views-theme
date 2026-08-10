# Gallery

PDP / CMS media gallery (images + video). Scroll-snap canvas synced with a thumbnail strip, prev/next controls, and dots. Optional lazy-loaded fullscreen modal.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Gallery` | Owner JS: index SoT, `select` / `prev` / `next` / `setIndex` / `getIndex`, thumb+dot click delegation, control disabled state, pause inactive slide videos, `ViewsTheme:Gallery:Change` |
| `Gallery:Thumbnails` | Strip shell; `scrollToIndex` keeps active thumb visible (rect math + clamp); composes `Scroll:Area` as scrollport (edge fades) + `__list` flex row/column |
| `Gallery:Thumb` | Thumb control identity + `aria-current`; `index` in options; video = poster only + play badge |
| `Gallery:Canvas` | Scroll-snap track; `goTo` via `scrollIntoView`; settle via `getBoundingClientRect`; resize re-pins current index (`behavior: 'instant'`) → `setIndex` only on user scroll; optional fullscreen action slot |
| `Gallery:Slide` | One media slide identity; image via `sw_thumbnails`, video via Storefront `utilities/video.html.twig` |
| `Gallery:Control` | Prev/next → nearest Gallery owner (`closest` + instance), never global `callMethod` |
| `Gallery:Dots` / `Gallery:Dot` | Dot nav; same index / `aria-current` pattern as thumbs |
| `Gallery:Action:Fullscreen` | Lazy shell owner (multi-instance): fetch/mount/unmount `Gallery:Fullscreen`; open with media `ids` + current index; on close restore **own** parent index. Only the Action that mounted handles Open/Close (`payload.el === this._overlayEl`); never adopt foreign shells via global selector; unmount owned el only |
| `Gallery:Fullscreen` | Dialog shell (body lock, Escape, Tab trap); composes nested `Gallery` (SoT, `mode="fullscreen"`, `fullscreen=false`) |
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
| `Gallery` | `thumbnailAlign` | Thumb strip group align: `start` (default) or `center`. Sets `data-thumbnail-align`. When `center`, list uses auto margins (centers when content fits; collapses when overflowing so scroll stays reachable). Nested fullscreen shell always passes `center` |
| `Gallery:Thumb` / `Dot` | `index`, `active`, `total` | Identity + SSR `aria-current` |
| `Gallery:Control` | `direction`, `disabled` | `prev` \| `next`; clamp ends unless parent `rewind` |
| `Gallery:Canvas` | `multi` | When false, omit controls + dots |
| `Gallery:Canvas` | `rewind` | SSR control `disabled` when false at ends |
| `Gallery:Canvas` | `controlsOnHover` | Sets `data-controls-on-hover`; CSS-only show/hide of `.vi-gallery-canvas__controls` and `.vi-gallery-canvas__fullscreen` |
| `Gallery:Canvas` | `fullscreen` | When true, top-right `Gallery:Action:Fullscreen` with media ids |
| `Gallery:Action:Fullscreen` | `ids` | Ordered media UUIDs for XHR load |
| `Gallery:Fullscreen` | `medias`, `active` | Passed through to nested `Gallery` (`mode=fullscreen`, `thumbnailAlign=center`, …) |

## JS API

| API | Role |
|-----|------|
| `select(index, { emit, scroll })` | Activate index; optional canvas scroll; pause inactive slide videos |
| `setIndex(index, { emit })` | Canvas-driven update (no re-scroll); same video pause |
| `getIndex()` | Current 0-based index (fullscreen open/close hand-off) |
| `prev()` / `next()` | Clamp at ends; wrap when `rewind` |
| `ViewsTheme:Gallery:Change` | `{ el, index }` after user-facing change |
| `Gallery:Action:Fullscreen` `open()` / `close()` | Lazy shell lifecycle |
| `ViewsTheme:Gallery:Fullscreen:Open` | `{ el, index }` |
| `ViewsTheme:Gallery:Fullscreen:Close` | `{ el, index }` — Action restores parent gallery index + unmounts |

Discovery uses `[data-component="ViewsTheme:Gallery:…"]` — never CSS classes.

Child → owner commands (Control / Canvas settle) resolve the **nearest** Gallery via `closest` + `getInstanceByElement` so nested fullscreen galleries do not cross-talk.

## Fullscreen flow

1. `Gallery:Action:Fullscreen` reads `overlayUrl` + `ids` from options
2. Click / `open()` → if another gallery’s shell is live, **close it first** (owner restores index + unmounts) so `replaceMount` does not tear down foreign DOM without Close
3. `GET frontend.views-theme.gallery.fullscreen?ids[]=…&active=N` (N from parent `getIndex()`)
4. Response root mounted on `document.body`; Action stores `_overlayEl` (owned only — never re-query foreign shells)
5. Action waits for Fullscreen instance → `open()` (body lock, aria, focus close)
6. Nested `Gallery` is the media SoT inside the dialog
7. Close (button / backdrop / Escape) → emit Close `{ el, index }` → **only** the owning Action (`payload.el === this._overlayEl`) restores parent index, returns focus, unmounts owned el

Multi-instance: many Actions may listen on the same Open/Close bus; non-owners no-op. Toggle-on-click closes only the Action’s own shell.

Shell lifecycle (hard rule): **(re)fetch on every open**, **remove from DOM when close finishes** — see [JS conventions](../conventions/javascript.md#lazy-loaded-shells-critical).

### Controller

| Route name | Path | Method |
|------------|------|--------|
| `frontend.views-theme.gallery.fullscreen` | `/vi/gallery/fullscreen` | `GET` (XHR) |

Loads public media via `AbstractMediaRoute` / `MediaRoute`, re-orders to match requested ids, renders `ViewsTheme:Gallery:Fullscreen`.

Input: only valid UUIDs; max **50** ids (extra dropped). Invalid ids are ignored (no DAL errors).

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
| Active index | Gallery owner |
| Active thumb / dot | `aria-current` — CSS keys off attribute |
| Control ends | `disabled` + `aria-disabled` |
| Canvas position | scroll-snap; `goTo` via `scrollIntoView` (element target); `prefers-reduced-motion: reduce` → CSS `scroll-behavior: auto` + JS `behavior: 'auto'` on canvas/thumbs |

## CSS / sizing

| Concern | SoT |
|---------|-----|
| Slide size | Media: `inline-size: 100%`, `block-size: var(--vi-media-h, auto)`; shell `block-size: var(--vi-slide-h, auto)` |
| Thumb size | `.vi-gallery-thumb__image` **and** `.vi-gallery-thumb__poster` — `inline-size: var(--vi-thumb-size, 64px)`, `block-size: auto` (button has no fixed box size) |
| Aspect ratio | Slide media: `var(--vi-media-ar, var(--vi-image-ar, 4 / 3))`; thumb: `var(--vi-image-ar, 1 / 1)`. Theme may set shared `--vi-image-ar`; fullscreen sets **only** `--vi-media-ar` so thumbs keep their box |
| Layout | Always `display: grid` — never flex. Host inits `gap` / `cols` / `rows` / `areas` / `h` / `padding` via tokens |
| Canvas track | `.vi-gallery-canvas__track` — `display: grid`, `grid-auto-flow: column`, `grid-auto-columns: 100%`; `block-size: var(--vi-track-h, auto)` |
| `mode=default` | Content-height: token fallbacks only (no host assigns) |
| `mode=fullscreen` | Host **assigns** tokens only (`--vi-gallery-p`, `--vi-h`, `--vi-rows`, `--vi-media-ar` / `--vi-media-fit`, `--vi-*-h`, thumbs height). Never assigns shared `--vi-image-ar` / `--vi-image-fit` (thumbs consume those). No property re-declarations, no descendant selectors |
| Orientation breakpoint | **Only** `Gallery.css` nested `@media (min-width: 768px)` — **assigns** orientation tokens on multi host (no child rule rewrites; `Thumbnails.css` only consumes) |
| Named areas | `.vi-gallery-canvas` → `canvas`; `.vi-gallery-thumbnails` → `thumbs` |
| Single image | `data-multi="false"` — no thumbs/controls/dots; full-width canvas; fullscreen action still allowed |
| Controls on hover | Canvas `data-controls-on-hover="true"` — hide `.vi-gallery-canvas__controls` and `.vi-gallery-canvas__fullscreen` until `:hover` or `:has(.vi-gallery-control:focus-visible)` / `:has(.vi-gallery-action-fullscreen:focus-visible)`; only under `@media (hover: hover) and (pointer: fine)`; fade `var(--vi-control-fade-duration, 150ms)` |
| Fullscreen action | Canvas top-right (`.vi-gallery-canvas__fullscreen`); control-sized circular button (same tokens as `Gallery:Control`); same hover-gate as prev/next when `controlsOnHover` |
| Fullscreen shell | Fixed inset, minimal viewport padding (`p-2` / `p-md-3`); panel fills remaining space |

### Host tokens (init on base / consume in children; assign on variants)

Defaults: under + horizontal track; from `md+` start + vertical track + height lock. Theme may assign any token on the gallery host.

| Token | Default (var fallback) | Multi | `md+` multi assign | `mode=fullscreen` assign |
|-------|------------------------|-------|--------------------|--------------------------|
| `--vi-gap` | `12px` | — | `16px` | — |
| `--vi-gallery-p` | `var(--spacing-0)` | — | — | `var(--spacing-4)` |
| `--vi-h` / `--vi-min-h` | `auto` / `auto` | — | — | `100%` / `0` |
| `--vi-overflow` | `visible` | — | — | `hidden` |
| `--vi-cols` | `minmax(0, 1fr)` | — | `var(--vi-thumbs-w, auto) minmax(0, 1fr)` | — |
| `--vi-rows` | `none` | — | — | multi: `minmax(0, 1fr) auto` (md: `minmax(0, 1fr)`); single: `minmax(0, 1fr)` |
| `--vi-areas` | `none` | `'canvas' 'thumbs'` | `'thumbs canvas'` | — |
| `--vi-thumbs-w` | — | — | used inside `--vi-cols` (`auto`) | — |
| `--vi-thumbs-dir` / `--vi-thumbs-snap` | `row` / `x mandatory` (Thumbnails) | — | `column` / `y mandatory` | — |
| `--vi-thumbs-mi` / `--vi-thumbs-mb` | `0` / `0` (list margins) | — | — | —; `thumbnailAlign=center` assigns `auto` / `auto` (center when fits; overflow margins collapse) |
| `--vi-thumb-snap-align` | `start` (Thumb) | — | — | —; `thumbnailAlign=center` assigns `center` |
| `--vi-thumbs-h` / `--vi-thumbs-min-h` | `auto` / `0` | — | `0` / `100%` | `auto` / `0` (md multi: h `100%`) |
| `--vi-thumbs-track-h` | `auto` | — | `100%` | — |
| `--vi-canvas-h` / `--vi-track-h` / `--vi-slide-h` / `--vi-media-h` | `auto` | — | — | `100%` |
| `--vi-track-rows` | `auto` (Canvas track `grid-auto-rows`) | — | — | `minmax(0, 100%)` — definite row so slide/media `%` heights resolve |
| `--vi-image-ar` | slide `4 / 3` via chain; thumb `1 / 1` | — | — | **unset** (thumbs must keep box) |
| `--vi-image-fit` | slide image `fill` / video `contain` via chain; thumb `cover` | — | — | **unset** (thumbs keep `cover`) |
| `--vi-media-ar` / `--vi-media-fit` | fall through to `--vi-image-*` | — | — | `auto` / `contain` (slide canvas only) |

`Thumbnails.css` / `Canvas.css` / `Slide.css` only **consume** height and media tokens. Host never re-declares those properties on variants.

Thumb track is `Scroll:Area` (`.vi-gallery-thumbnails__track` + `.vi-scroll-area`) with inner `.vi-gallery-thumbnails__list` (flex + gap; margins consume `--vi-thumbs-mi` / `--vi-thumbs-mb`). Edge fades via `data-scroll-up|down|start|end` → `--fade-*` (eased, `var(--vi-fade, 40px)` / `var(--vi-fade-duration, 200ms)`). `scrollToIndex` uses `getBoundingClientRect` + clamp so nested list + center margins stay correct.

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
