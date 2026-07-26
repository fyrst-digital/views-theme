# Cart drawer

Lazy-loaded end-side drawer for the mini-cart, opened from the header cart action.

All UI lives under UX components (`components/Drawer/*`, `components/Cart/*`, `components/LineItem/*`). Markup is served by theme routes under `/vi/…` — not core `/widgets/checkout/info` or offcanvas cart templates.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Cart:Drawer:Action` | Lazy fetch/mount; toggle `Drawer` open/close; header badge via `ViewsTheme:Cart:Changed` |
| `Cart` | Always-mounted mutation owner: listens for cart intents, POSTs core checkout routes, emits `Cart:Changed` |
| `Cart:Drawer` | Thin composition — **no** JS. Overrides Drawer `panel` / header; body is `Cart:Drawer:Body` |
| `Cart:Drawer:Body` | While open: on `Cart:Changed` refetches heading / items / footer fragments and swaps roots |
| `Cart:Drawer:Items` | Line list or empty state |
| `Cart:Drawer:Footer` | Promotion, shipping calculation, summary, checkout CTA |
| `Cart:Drawer:Heading` | Title + item count host for header chrome |
| `Drawer` | Shell: open/close a11y, motion; shared with navigation |
| `LineItem:Element:Quantity` / `Remove` | Emit `Cart:Update` / `Cart:Remove` (no form redirect in JS path) |
| `Cart:PromotionForm` / `ShippingCalculation` | Emit `Cart:Promote` / `Cart:Configure` |

## Features

- Header `Cart:Drawer:Action` (handbag icon + badge) opens the cart drawer on click
- Drawer shell lifecycle (hard rule): **(re)fetch on every open**, **remove from DOM when close finishes** — never cache HTML or keep a closed mount (see [JS conventions](../conventions/javascript.md#lazy-loaded-shells-critical))
- Generic `ViewsTheme:Drawer` primitive owns open/close, backdrop, Escape, focus trap, body scroll lock (`side="end"`)
- Line items via shared `LineItem:*` components; quantity and remove use AJAX + events
- Promotion form, shipping pre-calculation, summary, checkout CTA
- Empty, loading (`aria-busy`), and error (`role="alert"`) states
- Header badge tracks cart via `ViewsTheme:Cart:Changed` — not core `OffCanvasCart` / `CartWidget`
- Product **add does not open** the theme drawer or core offcanvas (`window.openOffcanvasAfterAddToCart = '0'`); badge updates only. Open-on-add is a follow-up

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

Always-mounted `ViewsTheme:Cart` (header) owns HTTP against core checkout endpoints.

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

After a successful mutation, Cart refreshes `window.cartCount` from `frontend.checkout.cart.json` and emits `Changed`. Action updates the badge; Body (if mounted) refreshes fragments.

Core `AddToCart` is forced to the silent path (`openOffcanvasAfterAddToCart = '0'`). Cart re-subscribes on `PluginManager.initializePlugins` and treats `addToCartWithoutOffcanvas` as a successful add for badge refresh.

### Partial DOM updates (drawer open)

1. Sub-components emit cart intents
2. `Cart` performs HTTP and emits `Cart:Changed`
3. `Cart:Drawer:Body` fetches fragments in parallel and replaces roots by `data-component` identity:
   - `ViewsTheme:Cart:Drawer:Items`
   - `ViewsTheme:Cart:Drawer:Footer`
   - `ViewsTheme:Cart:Drawer:Heading`
4. Parse with `<template>`; single `_busy` flight

Shell open remains a full refetch. Partials are only for in-session mutations while the drawer stays open.

### Controller

| Route name | Path | Method | Renders |
|------------|------|--------|---------|
| `frontend.views-theme.cart.drawer` | `/vi/cart/drawer` | `GET` (XHR) | `ViewsTheme:Cart:Drawer` |
| `frontend.views-theme.cart.drawer.items` | `/vi/cart/drawer/items` | `GET` (XHR) | `ViewsTheme:Cart:Drawer:Items` |
| `frontend.views-theme.cart.drawer.summary` | `/vi/cart/drawer/summary` | `GET` (XHR) | `ViewsTheme:Cart:Drawer:Footer` |
| `frontend.views-theme.cart.drawer.heading` | `/vi/cart/drawer/heading` | `GET` (XHR) | `ViewsTheme:Cart:Drawer:Heading` |

All load `CheckoutCartPageLoader` (cart + countries + payment/shipping methods) and render via `ComponentRendererInterface`.

## Hooks

| Component | Attribute |
|-----------|-----------|
| Cart owner | `data-component="ViewsTheme:Cart"` |
| Action button | `data-component="ViewsTheme:Cart:Drawer:Action"` |
| Drawer root (mount) | `data-component="ViewsTheme:Drawer"` / `#vi-cart-drawer` |
| Body coordinator | `data-component="ViewsTheme:Cart:Drawer:Body"` |
| Quantity | `data-component="ViewsTheme:LineItem:Element:Quantity"` |
| Remove | `data-component="ViewsTheme:LineItem:Element:Remove"` |
| Promotion form | `data-component="ViewsTheme:Cart:PromotionForm"` |
| Shipping calculation | `data-component="ViewsTheme:Cart:ShippingCalculation"` |

Action options (`data-component-options`): `drawerUrl`, `changedEvent`.

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
| Body / fragments | `src/Resources/views/components/Cart/Drawer/{Body,Items,Footer,Heading}.*` |
| Line item qty/remove | `src/Resources/views/components/LineItem/Element/{Quantity,Remove}.*` |
| Header wire-up | `src/Resources/views/components/Page/Header/Actions.html.twig` |

## Out of scope (v1)

- Opening the theme drawer (or any shell) on product add / variants-grid success
- Cookie offcanvas → `Drawer`
- Full checkout / confirm page redesign
- Cart page layout redesign (shared `LineItem:*` API only)
