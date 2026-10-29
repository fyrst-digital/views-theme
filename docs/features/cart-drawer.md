# Cart drawer

Lazy-loaded end-side drawer for the mini-cart, opened from the header cart action.

All UI lives under UX components (`components/Drawer/*`, `components/Cart/*`, `components/LineItem/*`). Markup is served by theme routes under `/vi/…` — not core `/widgets/checkout/info` or offcanvas cart templates.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Cart:Drawer:Action` | Lazy fetch/mount; toggle open/close; auto-open on configured `Cart:Changed` actions. Public `open()` / `close()` (`callMethod`). Composes `Button` + badge |

| `Cart` | Always-mounted mutation owner: listens for cart intents, POSTs core checkout routes, emits `Cart:Changed` |
| `Cart:Drawer` | Thin composition — **no** JS. Overrides Drawer `panel` / header; body is `Cart:Drawer:Body` |
| `Cart:Drawer:Body` | While open: on `Cart:Changed` re-fetches drawer HTML and swaps Flashes / Heading / Items / Shipping / Footer roots |
| `Cart:Flashes` | Session flash bag (`app.flashes`) via `ViewsTheme:Alert`; shared with [cart page](cart-page.md) |
| `Cart:Items` | Stacked line items (`layout="stacked"`, no list wrapper), or `Cart:Empty`. Register aside uses the same list. The cart page table is [`LineItems:Table`](cart-page.md) |
| `Cart:Empty` | Empty-cart message (`role="status"`); reusable outside the drawer |
| `Cart:Shipping` | Shipping details card ([cart page](cart-page.md) shares it): `Shipping:Calculation`, always open. In the drawer it is a Body child between Items and Footer (`flex-shrink-0`, outside the scroll area, so it stays pinned above the footer). Omitted without a physical line item. The callers (`Cart:Page:Aside`, `Cart:Drawer:Body`) skip it when `ViewsTheme.config.checkoutShippingCalculationActive` is off — the component itself does not read the config |
| `Cart:Drawer:Footer` | Summary, `Cart:Options` (promotion only; its `shipping` block is emptied), `Cart:Actions` — **omitted** when cart is empty (no root) |
| `Cart:Options` | Layout wrapper for promotion form + shipping calculation |
| `Cart:Actions` | CTA wrapper (layout); default content is checkout + cart |
| `Cart:Action:Checkout` | Confirm-page link via generic `Button`; label `viewsTheme.cart.checkout` |
| `Cart:Action:Cart` | Cart-page link via generic `Button`; label `viewsTheme.cart.cart` |
| `Cart:Drawer:Heading` | Title + item count host for header chrome |
| `Drawer` | Shell: open/close a11y, motion; shared with navigation |
| `LineItem:QuantityInput` / `Remove` | Emit `Cart:Update` / `Cart:Remove` (no form redirect in JS path). Grouped in `LineItem:Actions` |
| `Cart:PromotionForm` / `Shipping:Calculation` | Promotion emits `Cart:Promote`; shipping writes to the [shipping store](#shipping-store) (composed by `Cart:Options` / `Cart:Shipping`). Promotion = `<form>` + `Form:Input:Group` + `Button`; shipping = `div` + `Shipping:Calculation:Selection` → field adapters → `Form:Select` |

## Features

- Header `Cart:Drawer:Action` (handbag icon + badge) toggles the cart drawer on click
- Successful `Cart:Changed` with `action` in `openOnActions` (default `['add']`) calls Action `open()` — fetch + mount if closed; no-op if already open (Body refreshes)
- Twig/JS: `openOnActions` (default `['add']`); pass `:openOnActions="[]"` to disable auto-open
- Public API: `open()` / `close()` via `Shopware.callMethod('ViewsTheme:Cart:Drawer:Action', 'open'|'close')`
- Drawer shell lifecycle (hard rule): **(re)fetch on every open**, **remove from DOM when close finishes** — never cache HTML or keep a closed mount (see [JS conventions](../conventions/javascript.md#lazy-loaded-shells-critical))
- Generic `ViewsTheme:Drawer` primitive owns open/close, backdrop, Escape, focus trap, body scroll lock (`side="end"`)
- Line items via shared `LineItem:*` UX components; quantity and remove use AJAX + events
- Summary, cart options (promotion form + shipping pre-calculation), CTAs (`Cart:Actions` → `Cart:Action:Checkout` + `Cart:Action:Cart` → `Button`) — Footer only when cart has line items
- Empty, loading (`aria-busy`), session flash messages (success/danger from core cart mutations), and client error (`role="alert"`) states
- Header badge (`Cart:Drawer:Action:Badge`) tracks cart via `ViewsTheme:Cart:Changed` — not core `OffCanvasCart` / `CartWidget`
- Listing/PDP buy: `Product:Action:Buy` → `Cart:Add` → badge + drawer open (Action). Variants grid still core `data-add-to-cart` (follow-up)
- Cart page mutations refresh theme `Cart:Page` islands — see [cart page](cart-page.md)

## How it works

### Open flow

1. `ViewsTheme:Cart:Drawer:Action` reads `drawerUrl` / `openOnActions` from `data-component-options`
2. **Click:** if Drawer open → `close()` (no fetch); else `open()`
 3. **`open()`** (click, `callMethod`, or auto from `Cart:Changed`): if already open → no-op; else **always** fetch `frontend.views-theme.cart.drawer` (`AbortController`; stale responses ignored)
 4. Response root is `ViewsTheme:Drawer` (`#vi-cart-drawer`); any leftover mount is removed, then the new root is appended to `document.body`
 5. Drawer + Panel + Body + LineItem children initialize; Action calls Drawer `open()` (logs if instance never mounts)
 6. Drawer emits `ViewsTheme:Drawer:Open` via `Shopware.emitQueued`; Action sets `aria-expanded`
 7. On `ViewsTheme:Drawer:Close`: Action sets `aria-expanded`, **removes** the drawer root (no focus restore — avoids scroll jump)
 8. Action `destroy()` aborts in-flight open fetch and unmounts any open shell
 9. **Auto-open:** on `Cart:Changed` with `ok` and `action` ∈ `openOnActions` → `open()` (Body still owns in-open refresh)

### Mutation API

Always-mounted `ViewsTheme:Cart` (header) owns HTTP against core checkout endpoints. Concurrent intents use a **serial queue** with per-`lineItemId` coalesce (last write wins per line item; unkeyed intents FIFO).

| Event (request) | Payload | HTTP |
|-----------------|---------|------|
| `ViewsTheme:Cart:Add` | `{ items? \| formData, source? }` | `POST frontend.checkout.line-item.add` |
| `ViewsTheme:Cart:Remove` | `{ lineItemId, source? }` | `POST frontend.checkout.line-item.delete` |
| `ViewsTheme:Cart:Update` | `{ lineItemId, quantity, source? }` | `POST frontend.checkout.line-item.change-quantity` |
| `ViewsTheme:Cart:Promote` | `{ code? \| formData, source? }` | `POST frontend.checkout.promotion.add` |

| Event (result) | Payload |
|----------------|---------|
| `ViewsTheme:Cart:Changed` | `{ ok, count, action, error?, source? }` |

AJAX POSTs **omit** `redirectTo` / `forwardTo` (and use `redirect: 'manual'`). Empty `redirectTo` makes core redirect to the home page; `fetch` would follow that into a page route and get **403** (`preventPageLoadingFromXmlHttpRequest`). Twig forms still keep `redirectTo` for no-JS progressive enhancement; Cart strips those fields before POST.

After a successful mutation, Cart refreshes `window.cartCount` from `frontend.checkout.cart.json` and emits `Changed`. Badge updates itself; Body (if mounted) re-fetches drawer HTML and swaps islands.

Callers may emit `ViewsTheme:Cart:Add` / `ViewsTheme:Cart:Changed` directly. `Product:Action:Buy` emits `Cart:Add` with form `FormData`. Variants grid still uses core AddToCart (follow-up).

### In-open DOM updates

1. Sub-components emit cart intents
2. `Cart` performs HTTP and emits `Cart:Changed`
 3. `Cart:Drawer:Body` fetches `frontend.views-theme.cart.drawer` (same route as open) and replaces roots by `data-component` identity:
    - `ViewsTheme:Cart:Flashes` (core `addFlash` messages; `app.flashes` consumes the bag)
    - `ViewsTheme:Cart:Items` (`layout="stacked"`)
    - `ViewsTheme:Cart:Shipping` (optional — a newly present island is inserted before the footer, not appended)
    - `ViewsTheme:Cart:Drawer:Footer` (optional — remove when missing in response, append when newly present)
    - `ViewsTheme:Cart:Drawer:Heading`
 4. Parse with `<template>`; Body refresh aborts stale fetches and queues one follow-up while busy. Island swap: both → replace; existing only → remove; next only → append to target root

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

See [architecture — data + App hooks](../architecture.md#theme-xhr-controllers-data-app-hooks).

### LineItem (shared UX)

```text
LineItem:Product
├─ Product:Cover
├─ LineItem:Content
│  ├─ LineItem:Header → Product:Name + DeliveryDate
│  └─ LineItem:Body → Product:Variations + Features
└─ LineItem:Footer → Actions (QuantityInput + Remove) or Quantity, then Price
```

| Component | Role |
|-----------|------|
| `LineItem` | Class router. `#[PostMount]` sets `typeComponent` and `typeProps`; Twig calls `component()`. Order: `product` → Product (wins over a discount-like price); not-good with `totalPrice <= 0`, or type `discount` → Promotion; `container` → Container; else Generic. `tag` (`div` from `Cart:Items` and `LineItems:Table`) and `layout` (`stacked` default on drawer and register `Cart:Items`, `table` on [cart page](cart-page.md) and [confirm](checkout-confirm.md) `LineItems:Table`) are in `typeProps`. Caller `cva`, `class`, and nests are merged into the `component()` data (`typeProps|merge(attributes.all())`), not nested under an `attributes` key, so leaf `{% props %}` can bind `cva`. Promotion’s bag is only `lineItem`, `tag`, `layout` |
| `LineItem:Product` | Thin orchestrator; root tag from `tag` |
| `LineItem:Content` | Right column stack |
| `LineItem:Header` | Product name, then the delivery window. Name is `d-inline` here (`Product:Name` stays `d-inline-flex` elsewhere). `header:name:class` appends on Header, then that string replaces `Product:Name`’s root |
| `LineItem:Body` | Variations / features |
| `LineItem:Footer` | `LineItem:Actions` or `LineItem:Quantity`, then the line total. Never both. Actions when `showQuantitySelect` and `showRemoveButton` are true, `nestingLevel < 1`, and the line item has `quantityInformation`, is `stackable`, and is `removable`. Otherwise the plain number. `stacked` stays that flex row at every width (total `ms-auto`). `table` below `lg` is the same flex row. The stepper and remove stay one group when the footer wraps. From `lg`, the table-layout line item root is `d-lg-contents` and the footer is `display: contents`, so cover, content, qty, and price are cells of `LineItems:Table`. The row rule is a sibling `Divider` on the table (`itemLine`), at every viewport, not after the last row |
| `LineItem:Price` | Line total (`totalPrice\|currency`); skip delivery-discount scope — not `Product:Price` |
| `Product:Cover` | Line thumb / placeholder |
| `Product:Name` | Label + optional PDP link (scalar `name`/`url`) |
| `Product:Variations` | `payload.options`. Each badge is `group: option` (for example `Color: Oat`). An empty `group` shows the option alone |
| `LineItem:Features` | `payload.features` |
| `LineItem:DeliveryDate` | Delivery window when configured. In the header, under the name, in every layout including `table` below `lg` |
| `LineItem:Actions` | Flex group. Always renders `QuantityInput` and `Remove` |
| `LineItem:Quantity` | Plain quantity. No JS. Below `lg` the label is “Quantity” (`viewsTheme.lineItems.quantityLabel`) beside a `fw-semibold` amount; from `lg` only the amount shows |
| `LineItem:QuantityInput` | Debounced emit `Cart:Update`. Digital rows keep the stepper disabled |
| `LineItem:Remove` | Emit `Cart:Remove` |
| `LineItem:Promotion` | Slim promotion row; reuses `Content` + `Price` |

Region-nested override keys on `LineItem:Product`:

| Nest | Target |
|------|--------|
| `cover` | `Product:Cover` |
| `content` | `LineItem:Content` |
| `header` | `LineItem:Header` |
| `header:name` | `Product:Name` |
| `header:deliveryDate` | `LineItem:DeliveryDate` |
| `body` | `LineItem:Body` |
| `body:variations` | `Product:Variations` |
| `body:features` | `LineItem:Features` |
| `footer` | `LineItem:Footer` |
| `footer:price` | `LineItem:Price` |
| `footer:actions` | `LineItem:Actions` |
| `footer:actions:quantityInput` | `LineItem:QuantityInput` (further `quantityInput:*` → `QuantityInput`; ± are `Button` nests; `quantityInput:icon:class` / `decrease:*` / `increase:*`) |
| `footer:actions:remove` | `LineItem:Remove` (`button:*` → remove Button) |
| `footer:quantity` | `LineItem:Quantity` (plain number) |

The table row rule is not a Product nest. `LineItems:Table` renders `Divider` after each row (`itemLine`) except the last — [cart page](cart-page.md).

No wishlist on line items. No core offcanvas class hooks; no `data-form-auto-submit`. Forms keep progressive-enhancement `redirectTo` for no-JS.

## Hooks

| Component | Attribute |
|-----------|-----------|
| Cart owner | `data-component="ViewsTheme:Cart"` |
| Action (`Button` root) | `data-component="ViewsTheme:Cart:Drawer:Action"` |
| Action badge | `data-component="ViewsTheme:Cart:Drawer:Action:Badge"` |
| Drawer root (mount) | `data-component="ViewsTheme:Drawer"` / `#vi-cart-drawer` |
| Body coordinator | `data-component="ViewsTheme:Cart:Drawer:Body"` |
| Flashes / Items | `data-component="ViewsTheme:Cart:Flashes"` / `ViewsTheme:Cart:Items` |
| Shipping | `data-component="ViewsTheme:Cart:Shipping"` |
| Heading / Footer | `data-component="ViewsTheme:Cart:Drawer:Heading"` / `ViewsTheme:Cart:Drawer:Footer` |
| Quantity input | `data-component="ViewsTheme:LineItem:QuantityInput"` |
| Remove | `data-component="ViewsTheme:LineItem:Remove"` |
| Promotion form | `data-component="ViewsTheme:Cart:PromotionForm"` |
| Shipping calculation field | `data-component="ViewsTheme:Shipping:Calculation:Field"` (one per select; `data-component-options.field` = `countryId` / `paymentMethodId` / `shippingMethodId`) |

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

### Shipping store

`@views-theme/modules/shipping/store.js` holds the shipping calculation state as signals (`shared/signal.js`; `subscribe` notifies on change and does not replay).

| Export | Role |
|--------|------|
| `values` | Signal of `{ countryId?, paymentMethodId, shippingMethodId }` — current value per mounted field |
| `request` | Signal set **only** by `select` (user intent): `{ seq, values, source }` |
| `connect(name, value)` | Field mount: registers the server-rendered value (no request); returns `disconnect`. The value is dropped with the last field of that name |
| `select(name, value, source?)` | Field change: updates `values` and sets `request` |

Each select is `ViewsTheme:Shipping:Calculation:Field` (`Field.js`): it reads only its own native `<select>`, `connect`s on init, writes with `select` on `change`, and mirrors `values` (so a page card and an open drawer stay in sync). `Cart` is the only executor: it subscribes to `request` and POSTs `frontend.checkout.configure` with the stored values (no `redirectTo`), then emits `Cart:Changed` like every other mutation. Nothing reads the DOM to build the request, so the fields can be moved anywhere.

### Shipping calculation

`Shipping:Calculation` is a plain `div` (no `<form>`, no island JS) that owns the physical-line-item guard. The selection stack is always visible (no disclosure). Drawer summary rows are `Cart:Summary:Total` (`fs-4`, `fw-semibold`) and `Cart:Summary:Shipping` (`fs-5`; value `fw-medium`). Grand total, net, and tax stay off. Field stack is composed:

| Piece | Component |
|-------|-----------|
| Selection stack | `ViewsTheme:Shipping:Calculation:Selection` |
| Country (guest only) | `…:Selection` → `…:Country` → `Form:Select` (`:options` + `:value`) |
| Payment method | `…:Selection` → `…:PaymentMethod` → `Form:Select` (+ leading disabled row when unavailable) |
| Shipping method | `…:Selection` → `…:ShippingMethod` → same as payment |

Children stay **anonymous** (no PHP class). Field adapters map entities to `{ value, label, disabled? }` in Twig and pass `:options` / `:value` into `Form:Select` (no `options` block override).

Nest names (via `Cart:Options` → `shipping:*`):

| Nest | Target |
|------|--------|
| `shipping:selection:*` | Selection root / props |
| `shipping:selection:country:*` | Country → `Form:Select` (default `size: sm` in nest defaults) |
| `shipping:selection:payment:*` | PaymentMethod → `Form:Select` |
| `shipping:selection:shipping:*` | ShippingMethod → `Form:Select` |
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
| Body / drawer islands | `src/Resources/views/components/Cart/Drawer/{Body,Footer,Heading}.*` |
| Shared flashes / items | `src/Resources/views/components/Cart/{Flashes,Items}.*` |
| Empty state | `src/Resources/views/components/Cart/Empty.*` |
| Options | `src/Resources/views/components/Cart/Options.*` |
| Actions | `src/Resources/views/components/Cart/Actions.*` |
| Checkout CTA | `src/Resources/views/components/Cart/Action/Checkout.*` |
| Cart CTA | `src/Resources/views/components/Cart/Action/Cart.*` |
| Line item | `src/Resources/views/components/LineItem/**` |
| Header wire-up | `src/Resources/views/components/Page/Header/Actions.html.twig` |

## Out of scope (v1)

- Opening the theme drawer on variants-grid success (product add already auto-opens via `openOnActions: ['add']`)
- Cookie offcanvas → `Drawer`
- Finish page redesign (confirm is [checkout-confirm](checkout-confirm.md))
- Add-by-number / `Cart:AddProductForm`
