# Cart drawer

Lazy-loaded end-side drawer for the mini-cart, opened from the header cart action.

All UI lives under UX components (`components/Drawer/*`, `components/Cart/*`, `components/LineItem/*`). Markup is served by theme routes under `/vi/…` — not core `/widgets/checkout/info` or offcanvas cart templates.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Cart:Drawer:Action` | Lazy fetch/mount; toggle `Drawer` open/close. Composes `ViewsTheme:Button` (`color="none"`, `icon="handbag"`); `Cart:Drawer:Action:Badge` in Button `append` |

| `Cart` | Always-mounted mutation owner: listens for cart intents, POSTs core checkout routes, emits `Cart:Changed` |
| `Cart:Drawer` | Thin composition — **no** JS. Overrides Drawer `panel` / header; body is `Cart:Drawer:Body` |
| `Cart:Drawer:Body` | While open: on `Cart:Changed` re-fetches drawer HTML and swaps Flashes / Heading / Items / Footer roots |
| `Cart:Drawer:Flashes` | Session flash bag (`app.flashes`) via `ViewsTheme:Alert`; consumed on render so messages do not leak to page content |
| `Cart:Drawer:Items` | Line list, or `Cart:Empty` when no line items |
| `Cart:Empty` | Empty-cart message (`role="status"`); reusable outside the drawer |
| `Cart:Drawer:Footer` | Summary, `Cart:Options`, `Cart:Actions` — **omitted** when cart is empty (no root) |
| `Cart:Options` | Layout wrapper for promotion form + shipping calculation |
| `Cart:Actions` | CTA wrapper (layout); default content is checkout + cart |
| `Cart:Action:Checkout` | Confirm-page link via generic `Button`; label `viewsTheme.cart.checkout` |
| `Cart:Action:Cart` | Cart-page link via generic `Button`; label `viewsTheme.cart.cart` |
| `Cart:Drawer:Heading` | Title + item count host for header chrome |
| `Drawer` | Shell: open/close a11y, motion; shared with navigation |
| `LineItem:Quantity` / `Remove` | Emit `Cart:Update` / `Cart:Remove` (no form redirect in JS path) |
| `Cart:PromotionForm` / `ShippingCalculation` | Emit `Cart:Promote` / `Cart:Configure` (composed by `Cart:Options`). Promotion = `<form>` + `Form:Input:Group` + `Button`; shipping = `<form>` + `ShippingCalculation:Selection` → field adapters → `Form:Select` |
| `Cart:ShippingCalculation:Open` | Summary shipping label button; `callMethod(ShippingCalculation, toggle)` to open/close the `<details>` |

## Features

- Header `Cart:Drawer:Action` (handbag icon + badge) opens the cart drawer on click
- Drawer shell lifecycle (hard rule): **(re)fetch on every open**, **remove from DOM when close finishes** — never cache HTML or keep a closed mount (see [JS conventions](../conventions/javascript.md#lazy-loaded-shells-critical))
- Generic `ViewsTheme:Drawer` primitive owns open/close, backdrop, Escape, focus trap, body scroll lock (`side="end"`)
- Line items via shared `LineItem:*` UX components; quantity and remove use AJAX + events
- Summary, cart options (promotion form + shipping pre-calculation `<details>`), CTAs (`Cart:Actions` → `Cart:Action:Checkout` + `Cart:Action:Cart` → `Button`) — Footer only when cart has line items
- Empty, loading (`aria-busy`), session flash messages (success/danger from core cart mutations), and client error (`role="alert"`) states
- Header badge (`Cart:Drawer:Action:Badge`) tracks cart via `ViewsTheme:Cart:Changed` — not core `OffCanvasCart` / `CartWidget`
- Theme does **not** intercept core product-add / offcanvas (alpha). Product-add → theme drawer + badge is a follow-up with theme Product components
- Cart page mutations (when drawer is closed) trigger a full page reload so list/summary stay correct without a cart-page redesign

## How it works

### Open flow

1. `ViewsTheme:Cart:Drawer:Action` reads `drawerUrl` from `data-component-options`
2. If Drawer is already open → `close()` only (no fetch); close finishes → Action **unmounts** `#vi-cart-drawer`
3. Otherwise **always** fetches `frontend.views-theme.cart.drawer`
4. Response root is `ViewsTheme:Drawer` (`#vi-cart-drawer`); any leftover mount is removed, then the new root is appended to `document.body`
5. Drawer + Panel + Body + LineItem children initialize; Action opens Drawer
6. Drawer emits `ViewsTheme:Drawer:Open` via `Shopware.emitQueued`; Action sets `aria-expanded`
7. On `ViewsTheme:Drawer:Close`: Action sets `aria-expanded`, returns focus, **removes** the drawer root

### Mutation API

Always-mounted `ViewsTheme:Cart` (header) owns HTTP against core checkout endpoints. Concurrent intents use a **latest-wins** queue.

| Event (request) | Payload | HTTP |
|-----------------|---------|------|
| `ViewsTheme:Cart:Add` | `{ items? \| formData, source? }` | `POST frontend.checkout.line-item.add` |
| `ViewsTheme:Cart:Remove` | `{ lineItemId, source? }` | `POST frontend.checkout.line-item.delete` |
| `ViewsTheme:Cart:Update` | `{ lineItemId, quantity, source? }` | `POST frontend.checkout.line-item.change-quantity` |
| `ViewsTheme:Cart:Promote` | `{ code? \| formData, source? }` | `POST frontend.checkout.promotion.add` |
| `ViewsTheme:Cart:Configure` | `{ formData, source? }` | `POST frontend.checkout.configure` |

| Event (result) | Payload |
|----------------|---------|
| `ViewsTheme:Cart:Changed` | `{ ok, count, action, error?, source? }` |

AJAX POSTs **omit** `redirectTo` / `forwardTo` (and use `redirect: 'manual'`). Empty `redirectTo` makes core redirect to the home page; `fetch` would follow that into a page route and get **403** (`preventPageLoadingFromXmlHttpRequest`). Twig forms still keep `redirectTo` for no-JS progressive enhancement; Cart strips those fields before POST.

After a successful mutation, Cart refreshes `window.cartCount` from `frontend.checkout.cart.json` and emits `Changed`. Badge updates itself; Body (if mounted) re-fetches drawer HTML and swaps islands.

Callers may emit `ViewsTheme:Cart:Add` / `ViewsTheme:Cart:Changed` directly. Core storefront product-add is not wired into this bus yet (alpha).

### In-open DOM updates

1. Sub-components emit cart intents
2. `Cart` performs HTTP and emits `Cart:Changed`
3. `Cart:Drawer:Body` fetches `frontend.views-theme.cart.drawer` (same route as open) and replaces roots by `data-component` identity:
   - `ViewsTheme:Cart:Drawer:Flashes` (core `addFlash` messages; `app.flashes` consumes the bag)
   - `ViewsTheme:Cart:Drawer:Items`
   - `ViewsTheme:Cart:Drawer:Footer` (optional — remove when missing in response, append when newly present)
   - `ViewsTheme:Cart:Drawer:Heading`
4. Parse with `<template>`; latest-wins while a fetch is in flight. Island swap: both → replace; existing only → remove; next only → append to target root

Shell stays mounted (open state, focus trap). Only the islands are swapped — Body and Drawer root are not replaced. Open still full-refetches + mounts; close unmounts. Rendering flashes in the drawer prevents them from appearing in page `base_flashbags` after reload.

### Controller

| Route name | Path | Method | Renders |
|------------|------|--------|---------|
| `frontend.views-theme.cart.drawer` | `/vi/cart/drawer` | `GET` (XHR) | `ViewsTheme:Cart:Drawer` |

| Piece | Detail |
|-------|--------|
| Loader | `CheckoutCartPageLoader` — same DTO as the cart page (not `OffcanvasCartPageLoader`) |
| App hook | `CheckoutCartPageLoadedHook` (`checkout-cart-page-loaded`) after load, before render |
| Symfony event | `CheckoutCartPageLoadedEvent` (dispatched inside the loader) |
| Render | `AbstractComponentController::renderComponent()` → `ViewsTheme:Cart:Drawer` with prop `page` |
| SEO/media | Placeholder replace on the response — see [architecture — UX XHR](../architecture.md#ux-xhr-component-responses-critical) |

Used for shell open and in-open island refresh. Third parties that enrich cart **page** data (App scripts on `checkout-cart-page-loaded`, or subscribers to `CheckoutCartPageLoadedEvent`) apply to the drawer automatically. Do **not** target `checkout-offcanvas-widget-loaded` for this UI.

See [architecture — data + App hooks](../architecture.md#theme-xhr-controllers--data--app-hooks).

### LineItem (shared UX)

```text
LineItem:Product
├─ Product:Cover
└─ LineItem:Content
   ├─ LineItem:Header → Product:Name
   ├─ LineItem:Body → Product:Variations + Features + DeliveryDate
   └─ LineItem:Footer → Price + Quantity + Remove
```

| Component | Role |
|-----------|------|
| `LineItem` | Type router → Product / Promotion / Container / Generic; prop `tag` (default `li`) forwarded to leaf root |
| `LineItem:Product` | Thin orchestrator; root tag from `tag` |
| `LineItem:Content` | Right column stack |
| `LineItem:Header` | Product name |
| `LineItem:Body` | Variations / features / delivery |
| `LineItem:Footer` | Line total + quantity + remove (one row) |
| `LineItem:Price` | Line total (`totalPrice\|currency`); skip delivery-discount scope — not `Product:Price` |
| `Product:Cover` | Line thumb / placeholder |
| `Product:Name` | Label + optional PDP link (scalar `name`/`url`) |
| `Product:Variations` | `payload.options` |
| `LineItem:Features` | `payload.features` |
| `LineItem:DeliveryDate` | Delivery window when configured |
| `LineItem:Quantity` | Debounced emit `Cart:Update` |
| `LineItem:Remove` | Emit `Cart:Remove` |
| `LineItem:Promotion` | Slim promotion row; reuses `Content` + `Price` |

Region-nested override keys on `LineItem:Product`:

| Nest | Target |
|------|--------|
| `cover` | `Product:Cover` |
| `content` | `LineItem:Content` |
| `header` | `LineItem:Header` |
| `header:name` | `Product:Name` |
| `body` | `LineItem:Body` |
| `body:variations` | `Product:Variations` |
| `body:features` | `LineItem:Features` |
| `body:deliveryDate` | `LineItem:DeliveryDate` |
| `footer` | `LineItem:Footer` |
| `footer:price` | `LineItem:Price` |
| `footer:quantityInput` | `LineItem:Quantity` |
| `footer:remove` | `LineItem:Remove` |

No wishlist on line items. No core offcanvas class hooks; no `data-form-auto-submit`. Forms keep progressive-enhancement `redirectTo` for no-JS.

## Hooks

| Component | Attribute |
|-----------|-----------|
| Cart owner | `data-component="ViewsTheme:Cart"` |
| Action (`Button` root) | `data-component="ViewsTheme:Cart:Drawer:Action"` |
| Action badge | `data-component="ViewsTheme:Cart:Drawer:Action:Badge"` |
| Drawer root (mount) | `data-component="ViewsTheme:Drawer"` / `#vi-cart-drawer` |
| Body coordinator | `data-component="ViewsTheme:Cart:Drawer:Body"` |
| Flashes / Heading / Items / Footer | `data-component="ViewsTheme:Cart:Drawer:…"` (island swap targets) |
| Quantity | `data-component="ViewsTheme:LineItem:Quantity"` |
| Remove | `data-component="ViewsTheme:LineItem:Remove"` |
| Promotion form | `data-component="ViewsTheme:Cart:PromotionForm"` |
| Shipping calculation | `data-component="ViewsTheme:Cart:ShippingCalculation"` |
| Shipping calculation open | `data-component="ViewsTheme:Cart:ShippingCalculation:Open"` |

### Promotion form

`Cart:PromotionForm` owns the `<form>`, hidden `redirectTo`, and promote JS. Field UI is composed:

| Piece | Component |
|-------|-----------|
| Control + label | `ViewsTheme:Form:Input:Group` ([form-input](form-input.md#forminputgroup)) |
| Submit | `ViewsTheme:Button` (`type="submit"`, `icon="ticket"`, `color="secondary"`) in Group `append` |

Nest names (via `Cart:Options` → `promotion:*`):

| Nest | Target |
|------|--------|
| `promotion:field:*` | `Form:Input:Group` props / nested attrs (`field:input:class`, …) |
| `promotion:submit:*` | Submit `Button` props / attrs |
| `promotion:redirectTo` | Hidden redirect route name |

### Shipping calculation

`Cart:ShippingCalculation` owns the `<form>`, physical-line-item guard, `<details>` chrome, and configure JS. Disclosure toggle is `ViewsTheme:Button` with `tag="summary"` (native `<details>` / `<summary>`). Drawer summary shipping label uses `Cart:ShippingCalculation:Open` → `callMethod(…, toggle)` to open/close the same `<details>`. Field stack is composed:

| Piece | Component |
|-------|-----------|
| Selection stack + `redirectTo` | `ViewsTheme:Cart:ShippingCalculation:Selection` |
| Country (guest only) | `…:Selection` → `…:Country` → `Form:Select` (`:options` + `:value`) |
| Payment method | `…:Selection` → `…:PaymentMethod` → `Form:Select` (+ leading disabled row when unavailable) |
| Shipping method | `…:Selection` → `…:ShippingMethod` → same as payment |

Children stay **anonymous** (no PHP class). Field adapters map entities to `{ value, label, disabled? }` in Twig and pass `:options` / `:value` into `Form:Select` (no `options` block override).

Nest names (via `Cart:Options` → `shipping:*`):

| Nest | Target |
|------|--------|
| `shipping:selection:*` | Selection root / props |
| `shipping:selection:country:*` | Country → `Form:Select` props / nested attrs (`selection:country:select:class`, …) |
| `shipping:selection:payment:*` | PaymentMethod → `Form:Select` |
| `shipping:selection:shipping:*` | ShippingMethod → `Form:Select` |
| `shipping:size` | Default size for all three selects (`sm` / `md` / `lg`; default `sm`; forwarded into Selection) |
| `shipping:redirectTo` | Hidden redirect route name (forwarded into Selection) |
| `shipping:page` | Cart page DTO (countries / paymentMethods / shippingMethods) |

Action and Body options (`data-component-options`): `drawerUrl`. Badge options: `changedEvent`.

Events:

- `ViewsTheme:Drawer:Open` / `:Close` (payload: drawer element)
- `ViewsTheme:Cart:Add` / `:Remove` / `:Update` / `:Promote` / `:Configure`
- `ViewsTheme:Cart:Changed` (payload: `{ ok, count, action, error?, source? }`)

See [JavaScript conventions](../conventions/javascript.md).

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/CartDrawerController.php` |
| Cart owner | `src/Resources/views/components/Cart.*` |
| Drawer compose | `src/Resources/views/components/Cart/Drawer.*` |
| Action | `src/Resources/views/components/Cart/Drawer/Action.*` |
| Body / islands | `src/Resources/views/components/Cart/Drawer/{Body,Flashes,Items,Footer,Heading}.*` |
| Empty state | `src/Resources/views/components/Cart/Empty.*` |
| Options | `src/Resources/views/components/Cart/Options.*` |
| Actions | `src/Resources/views/components/Cart/Actions.*` |
| Checkout CTA | `src/Resources/views/components/Cart/Action/Checkout.*` |
| Cart CTA | `src/Resources/views/components/Cart/Action/Cart.*` |
| Line item | `src/Resources/views/components/LineItem/**` |
| Header wire-up | `src/Resources/views/components/Page/Header/Actions.html.twig` |

## Out of scope (v1)

- Opening the theme drawer (or any shell) on product add / variants-grid success
- Cookie offcanvas → `Drawer`
- Full checkout / confirm page redesign
- Cart page layout redesign (shared `LineItem:*` API + reload on mutation)
