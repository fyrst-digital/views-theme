# Carousel

Generic horizontal carousel on native CSS scroll-snap (no slider library), plus `Product:Carousel`, which renders `Product:Box` cards. It is also the canvas track of the [Gallery](gallery.md) (`Gallery:Canvas` composes it with full-width items). The CMS **product-slider** element renders through `Product:Carousel`; PDP **cross-selling** renders through [`Cms:CrossSelling`](#cmscrossselling) (theme `Tabs` + one `Product:Carousel` per tab). Core tiny-slider markup is not used on these surfaces.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Carousel` | Owner (`data-component="ViewsTheme:Carousel"`). Region shell, scroll-snap track, prev/next. Reads the track's overflow and scroll position, sets the host `data-overflow` and the controls' `disabled` / `aria-disabled`. Tracks the snapped item index and keeps it in place on resize. `prev()` / `next()` / `goTo(index)` / `getIndex()`, `ViewsTheme:Carousel:Change`. No product or gallery knowledge |
| `Carousel:Item` | Snap cell, identity only (`Item.js` is empty). Width from `--vi-carousel-item-w`, `scroll-snap-align: start`, slide a11y. Content from the default slot. Same identity-child pattern as `Gallery:Slide` |
| `Carousel:Control` | Prev/next button (`direction`). Calls the **nearest** Carousel via `closest` + `getInstanceByElement`, never global `callMethod`, so nested or sibling carousels stay independent. Root host of the shared [`Control`](#shared-control-chrome) |
| `Product:Carousel` (class-backed) | Product view-model shell. Optional title, then `Carousel` with one `Product:Box` per `Carousel:Item` |
| `Control` | Shared circular icon button chrome (no JS). See [below](#shared-control-chrome) |
| `Cms:CrossSelling` (class-backed) | CMS cross-selling element: theme `Tabs` with one `Product:Carousel` per cross-selling, on every viewport. See [below](#cmscrossselling) |

## Composition

```
Carousel (data-component owner, role=region, aria-roledescription=carousel)
├─ track  (scroll-snap scrollport, tabindex=0, id → aria-controls)
│    └─ {% block content %}  → Carousel:Item × N
└─ controls  (only when `controls` is true; hidden while data-overflow="false")
     ├─ Carousel:Control prev  → Control
     └─ Carousel:Control next  → Control

Product:Carousel
├─ title (optional <h2>)
└─ Carousel
     └─ Carousel:Item × N
          └─ Product:Box
```

```twig
{# Generic #}
<twig:ViewsTheme:Carousel label="Recently viewed">
    {% for product in products %}
        <twig:ViewsTheme:Carousel:Item :index="loop.index0" :total="products|length">
            <twig:ViewsTheme:Product:Box :product="product" />
        </twig:ViewsTheme:Carousel:Item>
    {% endfor %}
</twig:ViewsTheme:Carousel>

{# Product shortcut #}
<twig:ViewsTheme:Product:Carousel
    :products="element.data.products"
    title="Top sellers"
    boxLayout="default"
    itemWidth="280px"
/>
```

## Props

| Component | Prop | Default | Role |
|-----------|------|---------|------|
| `Carousel` | `label` | `null` | Region `aria-label` |
| `Carousel` | `controls` | `true` | Render prev/next |
| `Carousel` | `rewind` | `false` | `false`: controls are disabled at the start and end. `true`: next at the end scrolls to the start, prev at the start scrolls to the end |
| `Carousel` | `gap` | `default` | `default`: track CVA `gap-3 gap-md-4`. `none`: no gap utility, so the caller sets the gap in its own CSS (Gallery: 1px anti-bleed via `--vi-canvas-gap`) |
| `Carousel` | `id` | `vi-carousel-{random}` | Root id; the track is `{id}-track` (controls' `aria-controls`) |
| `Carousel` | `cva` | `{}` | Slots `root`, `track` (variant `gap`), `controls`. Nests `track:*` (e.g. `track:class`, `:track:tabindex="false"`), `controls:*` |
| `Carousel:Item` | `index`, `total` | `null` | 0-based position and count. Both set → `aria-label` "N of M" (`viewsTheme.carousel.slideLabel`); otherwise no label |
| `Carousel:Control` | `direction`, `disabled` | `next`, `false` | SSR state; the owner keeps it in sync |
| `Product:Carousel` | `products` | `[]` | Product collection, array or iterable. `null` entries are dropped |
| `Product:Carousel` | `title` | `null` | Optional heading. Also the carousel `label`; without it the label is core `component.cms.productGallery.ariaLabel` ("Product gallery containing N items") |
| `Product:Carousel` | `boxLayout` | `default` | Passed to `Product:Box` (`standard` / empty → `default`, same as the listing) |
| `Product:Carousel` | `itemWidth` | `null` | `280px`, `280` (→ px), `18rem`, `em`, `vw`. Valid → assigns `--vi-carousel-item-w` on the host with an inline `style` (precedent: `Navigation:Flyout`). Anything else (`%`, `0`, extra declarations) is ignored and the CSS fallback applies |
| `Product:Carousel` | `referrerCategoryId` | `null` | Passed through to `Product:Box` |

`Product:Carousel` nests: `title`, `carousel` (`:carousel:controls="false"`, `carousel:rewind`, …), `item`, `box` (`box:showActions`, `box:sizes`, …). CVA slots: `root`, `title`, `carousel`, `item`, `box`.

`Product:Carousel` passes `Product:Box` a `sizes` map with every breakpoint set to the item width (`itemWidth`, else `Carousel::DEFAULT_ITEM_WIDTH` = `200px`, which mirrors the CSS fallback), so the browser does not download listing-sized images. A theme that assigns a wider `--vi-carousel-item-w` in `_theme.scss` should pass `itemWidth` or `box:sizes` to match.

## CSS / tokens

| Concern | Where |
|---------|-------|
| Track layout | CVA `position-relative d-grid overflow-x-auto overflow-y-hidden`. `position-relative` makes the track the containing block, so absolutely positioned content in a slide (e.g. a `visually-hidden` rating label) is clipped by the scrollport instead of widening the page. `Carousel.css`: `grid-auto-flow: column`, `grid-auto-columns: var(--vi-carousel-item-w, 200px)`, `scroll-snap-type: x mandatory`, `overscroll-behavior-x: contain`, hidden scrollbar (same as `Gallery:Canvas` track) |
| Gap | Track CVA variant `gap`: `default` → `gap-3 gap-md-4`; `none` → no utility (the caller styles the gap). Not a token |
| Height | Root `block-size: var(--vi-carousel-h, auto)`; track `block-size: var(--vi-track-h, auto)`, `grid-auto-rows: var(--vi-track-rows, auto)`, `min-block-size: 0`. A host assigns them to fill a fixed-height panel (Gallery `mode=fullscreen`: `100%` / `minmax(0, 100%)`) |
| Item width | `Carousel:Item`: `inline-size: var(--vi-carousel-item-w, 200px)`, `scroll-snap-align: start`, `min-inline-size: 0`, `min-block-size: 0`. Assign the token per instance (`itemWidth`, inline `style`), per breakpoint (`_theme.scss`) or from a composing host (`Gallery:Canvas`: `100%`) without changing the template |
| Snap stop | `Carousel:Item`: `scroll-snap-stop: var(--vi-carousel-snap-stop, normal)`. `always` = one item per swipe (Gallery) |
| Smooth scroll | `scroll-behavior: smooth`; `prefers-reduced-motion: reduce` → CSS `auto`, JS `behavior: 'auto'` |
| Controls | CVA overlay (`position-absolute` inset 0, `d-flex align-items-center justify-content-between`, `pe-none`, `z-1`): start/end edge, vertically centred on the carousel. `Carousel.css` adds the inset `padding-inline: var(--vi-control-inset, var(--spacing-2))`. Chrome from `Control` |
| No overflow | Host `data-overflow="false"` hides its own controls (`> .vi-carousel__controls`, so nested carousels are unaffected). Not set on the server: controls show until JS has measured |
| RTL | Logical properties. JS works on the **logical** offset (`Math.abs(scrollLeft)`) and writes `-target` in RTL |

## JS behaviour

| API / event | Behaviour |
|-------------|-----------|
| `next()` | Scrolls to the start of the first item that is **not fully visible**, so a partly visible item is never skipped (a plain `+clientWidth` step can snap past it). Clamped to the end |
| `prev()` | Moves back by at most one viewport, to the first item edge inside it. Clamped to the start |
| Ends | Without `rewind`: no-op and the control is disabled. With `rewind`: next at the end → start, prev at the start → end |
| `goTo(index, { behavior })` | Scrolls **only the track** (`scrollTo`, no page jump) to item N's start, clamped to the end. `behavior`: `smooth` (default; `auto` under reduced motion) or `instant`. Sets the index and never emits. While hidden (`clientWidth` 0) it only stores the index; the resize re-pin scrolls once shown |
| `getIndex()` | Current item index: last `goTo`, or the snapped item after a user scroll |
| Item edges | Layout offsets (`offsetLeft` / `offsetWidth`; the `position-relative` track is the items' offsetParent), so the math is right mid-scroll and under transforms. RTL: `clientWidth - offsetLeft - width` |
| Programmatic gate | `goTo` sets it; `scrollend` releases it (timeout `450ms` fallback for smooth, two frames for instant). A user swipe that interrupts a smooth `goTo` still settles on `scrollend` |
| Settle | On `scrollend` (or `80ms` after the last `scroll` where `scrollend` is unsupported), outside the gate: the item whose start is nearest the logical offset (`nearestIndex`). New index → emit `ViewsTheme:Carousel:Change` `{ el, index }`. Prev/next paging is a user action and emits too |
| Resize | `ResizeObserver(track)`: state sync, and when the track **width** changed (resize, orientation, hidden pane shown) re-pins the current index with `behavior: 'instant'` after `50ms`. `goTo` records the width it pinned at, so a fresh `goTo` is not re-pinned |
| State sync | On `scroll` (rAF-throttled), `scrollend` and `ResizeObserver(track)`: host `data-overflow`, controls `disabled` + `aria-disabled`. A track with `clientWidth` 0 (hidden tab pane) keeps its state; the observer re-syncs when it is shown |
| Discovery | `[data-component="ViewsTheme:Carousel:Item|Control"]` whose nearest `ViewsTheme:Carousel` is this host. Track = parent of the first item (same as `Gallery:Canvas`) |
| Lifecycle | `destroy()` removes listeners, cancels frames and timers and disconnects the observer. Works when mounted later (XHR, tab panes) |
| Events | `ViewsTheme:Carousel:Change` `{ el, index }` (bus). Listeners filter by `el` (Gallery: nearest owner only) |

Scroll math lives in `@views-theme/modules/shared/scroll.js` (`scrollEdges`, `pageTarget`, `nearestIndex`; pure, unit-tested in `tests/js/modules/shared/scroll.test.mjs`). `Scroll:Area` uses `scrollEdges` for its horizontal edges too.

## Accessibility

- Root: `role="region"`, `aria-roledescription="carousel"`, `aria-label` from `label`.
- Items: `role="group"`, `aria-roledescription="slide"`, `aria-label` "N of M".
- Track: `tabindex="0"`, so the arrow keys scroll it natively. Tabbing to a link in an off-screen card scrolls it into view.
- Controls: `aria-controls` → track id; labels `general.previous` / `general.next` (same as Gallery); `disabled` + `aria-disabled` at the ends; hidden (`display: none`, out of the tab order) without overflow.
- The CMS bridge keeps the core skip link ("Skip product gallery") and its `content-after-target-{blockId}` anchor.
- No autoplay.

## Shared control chrome

`Control` (`components/Control.{html.twig,cva.twig,css}`) is the circular icon button: props `icon` (`vi_icon` name) and `label` (`aria-label` + `title`), `{% block content %}` for the icon. It has no `data-component`; interactive controls wrap it as their root host and add their own.

| Wrapper | Root class | Notes |
|---------|------------|-------|
| `Carousel:Control` | `vi-carousel-control` | |
| `Gallery:Control` | `vi-gallery-control` | Canvas hover gate keys off this class |
| `Gallery:Action:Fullscreen` | `vi-gallery-action-fullscreen` | |
| `Gallery:Fullscreen:Close` | `vi-gallery-fullscreen-close` | `Close.css` positions it |

Wrappers forward the icon with `{% vi_block icon %}`, so `<twig:block name="icon">` on the wrapper still replaces it.

| Token | Fallback |
|-------|----------|
| `--vi-control-size` | `40px` |
| `--vi-control-bg` | `var(--white)` |
| `--vi-control-color` | `currentColor` |
| `--vi-control-shadow` | `0 1px 4px rgba(0, 0, 0, 0.12)` |
| `--vi-control-disabled-opacity` | `0.4` (`:disabled` / `[aria-disabled='true']`) |
| `--vi-control-inset` | Host-owned position: Carousel `var(--spacing-2)`; Gallery canvas and fullscreen close `8px` |

## CMS bridge

| File | Role |
|------|------|
| `storefront/element/cms-element-product-slider.html.twig` | `sw_extends` core, overrides `element_product_slider`. `element.data.products.elements` → `products`, `sliderConfig.title` → `title`, `sliderConfig.boxLayout` → `boxLayout`, `sliderConfig.elMinWidth` → `itemWidth`, `navigationArrows == 'none'` → `:carousel:controls="false"`. Keeps the skip link (`element_product_slider_skip_slider`) and the `element_product_slider_target_after_slider` anchor. New block `element_product_slider_carousel` wraps the component |
| `storefront/element/cms-element-cross-selling.html.twig` | `sw_extends` core, overrides `cms_element_cross_selling_tabs_inner` → [`Cms:CrossSelling`](#cmscrossselling). No longer includes the product-slider element |
| `cms-block-product-slider`, `cms-block-product-three-column`, `cms-block-cross-selling` | Already bridged to `Cms:Element`; they render the element above |

Core slider config that is **ignored**: `rotate`, `autoplayTimeout`, `speed`, `border`, `verticalAlign`, `displayMode`, and the inside/outside arrow placement (arrows are always overlaid). Core inner Twig blocks (`element_product_slider_slider`, `_title`, `_inner`, `_element`, `_inner_item`, `_controls*`) no longer exist. The theme no longer renders `data-product-slider`, so core `ProductSliderPlugin` (tiny-slider) does not initialise on these surfaces.

## Cms:CrossSelling

PDP cross-selling, modelled on `Cms:DescriptionReviews`: the theme owns the tabs, so tabs **and** their content show on every viewport. Core Bootstrap tabs (`data-bs-toggle`), the mobile offcanvas tabs (`data-cross-selling`, which hid the tab content below `lg`) and the per-pane product-slider include are gone.

```
Cms:CrossSelling (class-backed; no JS)
├─ skip link            (when skipTarget)
├─ Tabs                 (owner JS: ARIA + keyboard)
│    ├─ Tabs:Tab × N    (cross-selling name)
│    └─ Tabs:Panel × N
│         └─ Product:Carousel  (no title; carousel label = cross-selling name)
└─ #content-after-target-{skipTarget}
```

| Prop | Default | Role |
|------|---------|------|
| `crossSellings` | `null` | `element.data.crossSellings` (`CrossSellingElementCollection` or iterable of `CrossSellingElement`) |
| `boxLayout` | `default` | Element config `boxLayout`, forwarded to `Product:Carousel` |
| `itemWidth` | `null` | Element config `elMinWidth`, forwarded to `Product:Carousel` |
| `skipTarget` | `null` | CMS block id: "Skip product gallery" link before the tabs + `content-after-target-{id}` anchor after them |

View-model (`CrossSelling.php`): `tabs` is a list of `Struct\CrossSellingTab` (`id`, `name`, `products`, `tabId` `cross-selling-tab-{id}`, `panelId` `cross-selling-tab-{id}-pane`) for every **active** cross-selling with `total > 0`, in element order. The first tab is active (`activeTabId`). `visible` is `false` when there is no tab: the template then renders nothing, so `Cms:Element` / `Cms:Block` drop the empty block (skip link included).

Nests / CVA: `tabs` (`tabs:param`, `tabs:label`, …) and `carousel` (any `Product:Carousel` prop or nest, e.g. `carousel:box:showActions`). CVA slots `root`, `tabs`, `panel`, `carousel`. Override blocks `skip` and `tabs`.

A carousel in a hidden panel keeps its last state; its `ResizeObserver` re-syncs the controls when the panel is shown. Core element config ignored: `displayMode`.

## Key source files

| Area | Path |
|------|------|
| Owner | `src/Resources/views/components/Carousel.{html.twig,cva.twig,css,js}` |
| Item / control | `src/Resources/views/components/Carousel/{Item,Control}.*` |
| Shared chrome | `src/Resources/views/components/Control.{html.twig,cva.twig,css}` |
| Product shell | `src/Resources/views/components/Product/Carousel.{php,html.twig,cva.twig}` |
| Scroll math | `src/Resources/app/storefront/src/modules/shared/scroll.js` |
| CMS bridges | `src/Resources/views/storefront/element/cms-element-product-slider.html.twig`, `…/cms-element-cross-selling.html.twig` |
| Cross-selling shell | `src/Resources/views/components/Cms/CrossSelling.{php,html.twig,cva.twig}`, `src/Struct/CrossSellingTab.php` |
| Tests | `tests/Unit/Resources/views/components/Product/CarouselTest.php`, `tests/Unit/Resources/views/components/Cms/CrossSellingTest.php`, `tests/js/modules/shared/scroll.test.mjs` |

## Out of scope

- Dots / pagination, autoplay, infinite loop (cloned slides), mouse drag-to-scroll
- Edge fades with `Scroll:Area` as the scrollport

## Related

- [Gallery](gallery.md): shared control chrome; `Gallery:Canvas` composes `Carousel` as its track
- [Product box](product-box.md)
- [Tabs](tabs.md)
- [Product reviews](review.md): `Cms:DescriptionReviews`, the same CMS-shell pattern
- [CMS layout](cms.md)
- [JavaScript](../conventions/javascript.md)
