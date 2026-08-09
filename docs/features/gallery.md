# Gallery

PDP / CMS image gallery. Scroll-snap canvas synced with a thumbnail strip, prev/next controls, and dots. No zoom modal or magnifier.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Gallery` | Owner JS: index SoT, `select` / `prev` / `next` / `setIndex`, thumb+dot click delegation, control disabled state, `ViewsTheme:Gallery:Change` |
| `Gallery:Thumbnails` | Vertical (md+) / horizontal (sm) strip; `scrollToIndex` keeps active thumb visible |
| `Gallery:Thumb` | Thumb control identity + `aria-current`; `index` in options |
| `Gallery:Canvas` | Scroll-snap track; `goTo(i)`; scroll settle → `callMethod(Gallery, 'setIndex', i)` |
| `Gallery:Slide` | One media slide identity |
| `Gallery:Control` | Prev/next → `callMethod(Gallery, 'prev'\|'next')` |
| `Gallery:Dots` / `Gallery:Dot` | Dot nav; same index / `aria-current` pattern as thumbs |

## Composition

```
Gallery (data-component owner)
├─ Gallery:Thumbnails          (only when medias|length > 1)
│    └─ Gallery:Thumb × N
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
| `Gallery:Thumb` / `Dot` | `index`, `active`, `total` | Identity + SSR `aria-current` |
| `Gallery:Control` | `direction`, `disabled` | `prev` \| `next`; clamp ends |
| `Gallery:Canvas` | `multi` | When false, omit controls + dots |

## JS API

| API | Role |
|-----|------|
| `select(index, { emit, scroll })` | Activate index; optional canvas scroll |
| `setIndex(index, { emit })` | Canvas-driven update (no re-scroll) |
| `prev()` / `next()` | Clamp at ends |
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
| Aspect ratio | `aspect-ratio: var(--vi-image-ar, 4 / 3)` on the image (theme may override `--vi-image-ar`) |

Slide shell is snap/flex only — no min/max height floors.

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
