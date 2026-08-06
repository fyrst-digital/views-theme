# Wishlist

Theme-owned wishlist: product toggle, header/nav badge, guest localStorage and logged-in core APIs. No core `AddToWishlist` / `WishlistStorage` / `WishlistWidget` on theme UI.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Wishlist` | Always-mounted owner: load, guest storage, logged-in HTTP, merge on login; emits `Wishlist:Changed` |
| `Product:Action:Wishlist` | Product heart Button; emits `Wishlist:Toggle`; syncs `aria-pressed` / label from `Changed` |
| `Wishlist:Action` | Header / nav link to wishlist page (`Button` + badge + live region) |
| `Wishlist:Action:Badge` | Count badge from `Changed` (and `window.wishlistCount` on late mount) |

## Wire-up

- Owner mounts once in `Page:Header:Actions` when `core.cart.wishlistEnabled` (next to `Cart`)
- Header: `Wishlist:Action` (`:label="false"`)
- Nav drawer title: `Wishlist:Action` with drawer-scoped `badgeId` / `liveId`
- Listing box: `Product:Action:Wishlist` on Cover `append`, `appearance="circle"`
- PDP: `BuyContainer` → `Product:Actions` → `Product:Action:Wishlist` (`showText`, `size: sm`)

## Events

| Event | Payload | Direction |
|-------|---------|-----------|
| `ViewsTheme:Wishlist:Toggle` | `{ productId, source? }` | Product action → owner |
| `ViewsTheme:Wishlist:Changed` | `{ ok, count, action, productId?, products?, error?, source? }` | Owner → hearts + badges |

`action`: `load` | `add` | `remove`.

Globals after each successful emit: `window.wishlistCount`, `window.wishlistProducts` (id map).

## Storage / HTTP

Same data as core widget; theme-owned JS only.

| Mode | Load | Add / remove |
|------|------|----------------|
| Guest | `localStorage` key `wishlist-{salesChannelId}` (core shape) | local only |
| Logged-in | `GET frontend.wishlist.product.list` | `POST frontend.wishlist.product.add` / `.remove` |
| Login + guest keys | `POST frontend.wishlist.product.merge` once, clear local, then list | |

Guest + cookie consent: without `wishlist-enabled` cookie, owner requests core `CookieConfiguration/requestConsent` and does not mutate.

## Product action

```twig
<twig:ViewsTheme:Product:Action:Wishlist
    :productId="product.id"
    appearance="circle"
/>
```

- Composes `ViewsTheme:Button` (single `vi_icon` via `icon` prop); no wrapper, no `data-add-to-wishlist`
- Props: `productId`, `showText`, `size`, `color`, `appearance` (`null` \| `circle`), `icon` (default `heart`), `iconActive` (default `heart-fill`), `cva`
- Options `icons: { add, remove }` — JS `_sync` swaps the icon **name** class on the existing node (`icon-${name}` only, no pack suffix); also updates `aria-pressed` + title/label
- Circle layout in co-located CSS; works with theme `icons.mode: css`

## Badge

No `data-wishlist-storage` / `data-wishlist-widget`. Listens to `Wishlist:Changed`; updates optional live region by `liveId`.

## Listing page

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/wishlist/listing.html.twig` — mounts `Wishlist:Listing` |
| `Wishlist:Listing` | Forwards props into `Product:Listing`; clears `actions`; overrides `Listing:Empty` `content` (illustration + copy) |

See [product-listing.md](product-listing.md) for the shared grid shell and Box wiring (`boxLayout` default `wishlist`).

## Known gaps

- Wishlist **page** chrome / guest pagelet still mostly core outside the listing bridge
- Core GA wishlist events hook `WishlistStorage` plugin instances — may not fire until a bridge exists
- Merge pagelet HTML into listing row is not handled (IDs merge only)

## Files

| Role | Path |
|------|------|
| Owner | `components/Wishlist.html.twig` + `Wishlist.js` |
| Product toggle | `components/Product/Action/Wishlist.{html.twig,cva.twig,js,css}` |
| Header action | `components/Wishlist/Action.html.twig` + `Action.cva.twig` |
| Badge | `components/Wishlist/Action/Badge.{html.twig,cva.twig,js}` |
| Listing shell | `components/Wishlist/Listing.html.twig` |
| Listing bridge | `storefront/component/wishlist/listing.html.twig` |
