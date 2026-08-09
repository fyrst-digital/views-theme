# Gallery

PDP / CMS image gallery. Scroll-snap canvas synced with a thumbnail strip, prev/next controls, and dots. No zoom modal or magnifier.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Gallery` | Owner JS: index SoT, `select` / `prev` / `next` / `setIndex`, thumb+dot click delegation, control disabled state, `ViewsTheme:Gallery:Change` |
| `Gallery:Thumbnails` | Strip shell; `scrollToIndex` keeps active thumb visible; composes `Scroll:Area` as scrollport (edge fades) |
| `Gallery:Thumb` | Thumb control identity + `aria-current`; `index` in options |
| `Gallery:Canvas` | Scroll-snap track; `goTo` via `scrollIntoView`; settle via `getBoundingClientRect`; resize re-pins current index (`behavior: 'instant'`) → `setIndex` only on user scroll |
| `Gallery:Slide` | One media slide identity |
| `Gallery:Control` | Prev/next → `callMethod(Gallery, 'prev'\|'next')` |
| `Gallery:Dots` / `Gallery:Dot` | Dot nav; same index / `aria-current` pattern as thumbs |

## Composition

```
Gallery (data-component owner)
├─ Gallery:Thumbnails          (only when medias|length > 1)
│    └─ Scroll:Area            (scrollport + axis-correct edge fades; track BEM)
│         └─ Gallery:Thumb × N
└─ Gallery:Canvas
     ├─ track
     │    └─ Gallery:Slide × N
     ├─ Gallery:Control prev/next   (multi only)
     └─ Gallery:Dots                (multi only)
          └─ Gallery:Dot × N
```

```twig
<twig:ViewsTheme:Gallery :medias="mediaItems" :active="0" />
```

## Props

| Component | Prop | Role |
|-----------|------|------|
| `Gallery` | `medias` | Media entities (flat list) |
| `Gallery` | `active` | 0-based initial index (SSR + JS hydrate) |
| `Gallery` | `rewind` | When `true`, next on last → first and prev on first → last; controls stay enabled (default `false` = clamp + disable at ends) |
| `Gallery:Thumb` / `Dot` | `index`, `active`, `total` | Identity + SSR `aria-current` |
| `Gallery:Control` | `direction`, `disabled` | `prev` \| `next`; clamp ends unless parent `rewind` |
| `Gallery:Canvas` | `multi` | When false, omit controls + dots |
| `Gallery:Canvas` | `rewind` | SSR control `disabled` when false at ends |

## JS API

| API | Role |
|-----|------|
| `select(index, { emit, scroll })` | Activate index; optional canvas scroll |
| `setIndex(index, { emit })` | Canvas-driven update (no re-scroll) |
| `prev()` / `next()` | Clamp at ends; wrap when `rewind` |
| `ViewsTheme:Gallery:Change` | `{ el, index }` after user-facing change |

Discovery uses `[data-component="ViewsTheme:Gallery:…"]` — never CSS classes.

### Active state

| Concern | SoT |
|---------|-----|
| Active index | Gallery owner |
| Active thumb / dot | `aria-current` — CSS keys off attribute |
| Control ends | `disabled` + `aria-disabled` |
| Canvas position | scroll-snap; `goTo` / user scroll |

## CSS / sizing

| Concern | SoT |
|---------|-----|
| Slide size | `.vi-gallery-slide__image` only — `inline-size: 100%`, `block-size: auto` |
| Thumb size | `.vi-gallery-thumb__image` only — `inline-size: var(--vi-thumb-size, 64px)`, `block-size: auto` (button has no fixed box size) |
| Aspect ratio | `aspect-ratio: var(--vi-image-ar, 4 / 3)` on slide + thumb images (theme may override `--vi-image-ar`) |
| Layout | Always `display: grid` — never flex |
| Orientation breakpoint | **Only** `Gallery.css` `@media (min-width: 768px)` — layout + thumbs height lock + track axis (no media in `Thumbnails.css`) |
| Named areas | `.vi-gallery-canvas` → `canvas`; `.vi-gallery-thumbnails` → `thumbs` |
| Single image | `data-multi="false"` — no thumbs/controls/dots; full-width canvas |

### Orientation tokens (theme assigns on gallery host)

Defaults: under + horizontal track; from `md+` start + vertical track + height lock. Override by assigning tokens (use theme media queries if responsive).

| Token | Under / horizontal fallback | Start / vertical fallback (`md+` in Gallery.css) |
|-------|----------------------------|--------------------------------------------------|
| `--vi-areas` | `'canvas' 'thumbs'` | `'thumbs canvas'` |
| `--vi-cols` | `minmax(0, 1fr)` | — |
| `--vi-thumbs-w` | — | `auto` (with `minmax(0, 1fr)` canvas col) |
| `--vi-thumbs-dir` | `row` | `column` |
| `--vi-thumbs-snap` | `x mandatory` | `y mandatory` |
| `--vi-thumbs-h` / `--vi-thumbs-min-h` | `auto` / `0` | `0` / `100%` |
| `--vi-thumbs-track-h` | `auto` | `100%` |

`Thumbnails.css` only consumes these (horizontal fallbacks). Slide shell is snap only — canvas image leads layout height.

Thumb track is `Scroll:Area` (`.vi-gallery-thumbnails__track` + `.vi-scroll-area`). Edge fades via `data-scroll-up|down|start|end` → `--fade-*` (eased, `var(--vi-fade, 40px)` / `var(--vi-fade-duration, 200ms)`).

## CMS bridge

| File | Role |
|------|------|
| `storefront/element/cms-element-image-gallery.html.twig` | Maps `element.data.sliderItems[].media` → `:medias`; core 1-based `startIndexSlider` → 0-based `:active` |

Default PDP layout: `cms-block-gallery-buybox` left slot (unchanged).

## Out of scope (this feature)

- Zoom modal / fullscreen gallery
- Magnifier
- Video / spatial / AR media branches
- Full CMS config surface (`galleryPosition`, arrow/dot placement enums, zoom flags)

## Related

- [Tabs](tabs.md) — same owner + identity-child pattern
- [Buy container](buy-container.md) — buy column beside gallery
- [JavaScript](../conventions/javascript.md)
