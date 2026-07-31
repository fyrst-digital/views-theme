# Product box

Listing / CMS product card UI. Core includes `component/product/card/box.html.twig`; the theme bridge mounts UX `Product:Box`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/product/card/box.html.twig` — thin `sw_extends`; maps core `standard`/empty → `default`, mounts `Product:Box` |
| `Product:Box` | Class-backed card shell: data-attr fields + flags; threads `product` / `referrerCategoryId` — **no** detail URL |
| `Product:Box:Header` | Class-backed: detail `href` + rating gate; Rating + Name. **Not** PDP `Product:Header` |
| `Product:Box:Body` | Description only (omits root when off) |
| `Product:Box:Footer` | Class-backed: detail `href` + tax-note default + variation gate; Price + Variations + Box:Actions |
| `Product:Box:Actions` | Class-backed listing shell: Buy **or** Detail (listing rules) |
| `Product:Actions` | Shared Buy **or** Detail shell (not mounted by Box) |
| `Product:Cover` | Class-backed: media + detail URL from `product` (scalar overrides for cart/search) |
| `ProductDetailUrlBuilder` | Shared listing detail URL (`productId` + optional `search` / `referrerCategoryId`) |
| `Name` / `Variations` / `Description` | Shared product primitives |
| `Product:Price` | Class-backed price row only; math via `ProductPriceResolver` |
| `ProductPriceResolver` | Shared price data for Price + Badges |
| `Product:Badges` | Class-backed shell: product → visibility gates; composes `Product:Badge:*` |
| `Product:Badge:Discount` / `Topseller` / `New` | Thin specialties → generic `Badge` |
| `Badge` | Generic label leaf (`type` CVA variants) |
| `Product:Price:Tiered` | Tier table — parent-mounted (e.g. BuyContainer), not nested in Price |
| `Product:Price:Tax` | Tax note — parent-mounted (BuyContainer, Box:Footer), not nested in Price |
| `Product:Action:Buy` (class-backed) / `Detail` / `Wishlist` | Buy form (quantity gate + pack unit VM), details Button, wishlist toggle |
| `Review:Rating` | Stars when reviews enabled |

## Wire-up

Every core call site that includes `box.html.twig` picks up the theme card:

- Category CMS product listing
- CMS product-box element
- Product slider / cross-sell (via slider slides)
- Search results listing
- Wishlist listing (core path)

```twig
{# storefront/component/product/card/box.html.twig #}
{% sw_extends '@Storefront/storefront/component/product/card/box.html.twig' %}

{% block component_product_box_include %}
    {% if product %}
        {% set boxLayout = layout|default('default') %}
        {% if boxLayout is empty or boxLayout is same as('standard') %}
            {% set boxLayout = 'default' %}
        {% endif %}

        <twig:ViewsTheme:Product:Box
            :product="product"
            :layout="boxLayout"
            :referrerCategoryId="referrerCategoryId|default(null)"
        />
    {% endif %}
{% endblock %}
```

Core CMS may still send `layout=standard` and a `displayMode` config. The bridge normalizes layout only; **`displayMode` is not part of the theme Box/Cover API** (image fit is CSS tokens on Cover).

This is an intentional **new** `views/storefront/` bridge (same role as header → `Page:Header:Main`). Do not add further storefront product-card files; extend UX under `components/Product/Box*`.

`Product:Listing` (components shell that also mounts Box) is **not** theme-inherited yet — grid column wrappers stay on core listing.

## Composition

```
Product:Box (class VM — no productUrl)
  ├─ Product:Cover (product → media + url via ProductDetailUrlBuilder)
  │    ├─ prepend → Product:Badges (class VM)
  │    │    ├─ Product:Badge:Discount → Badge type=discount
  │    │    ├─ Product:Badge:Topseller → Badge type=topseller
  │    │    └─ Product:Badge:New → Badge type=new
  │    ├─ media
  │    └─ append → Product:Action:Wishlist (if wishlist enabled)
  └─ content
        ├─ Product:Box:Header (href via builder → Name)
        │    ├─ Review:Rating
        │    └─ Product:Name
        ├─ Product:Box:Body
        │    └─ Product:Description
        └─ Product:Box:Footer (href via builder → Actions)
             ├─ Product:Price              (price row only)
             ├─ Product:Price:Tax          (when priceShowTaxNote)
             ├─ Product:Variations
             └─ Product:Box:Actions
                  ├─ Product:Action:Buy   (when buyable in listing)
                  └─ Product:Action:Detail (otherwise)
```

## Props

### `Product:Box` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | Sales channel product (`SalesChannelProductEntity`) |
| `layout` | `default` | Theme values: `default`, `image`, … (CVA `layout-*`). Core `standard`/empty mapped at bridge/listing only |
| `sizes` | fixed map (`xs`…`xxl`) | Forwarded to Cover |
| `showDescription` | `true` | Forwarded to Body |
| `showVariations` | `true` | Forwarded to Footer |
| `showPrice` / `showActions` | `true` | Forwarded to Footer |
| `priceShowPrice` | `true` | Forwarded to Footer → Price |
| `priceShowTaxNote` | `null` | Forwarded; Footer mounts `Product:Price:Tax` when true; defaults from `core.listing.allowBuyInListing` when null |
| `referrerCategoryId` | `null` | Threaded to Cover / Header / Footer for detail URL args |
| `cva` | `{}` | Multi-slot via `Box.cva.twig` |
| `id` / `name` / `brand` / `price` | derived | `data-product-information` only |
| `wishlistEnabled` | derived | `core.cart.wishlistEnabled` |

Does **not** compute or pass `productUrl` / `href`. Nested overrides: `header:…`, `body:…`, `footer:…`.

### `Product:Cover` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | `null` | When set, derives `id` / `name` / `cover` / `url` |
| `id` / `name` / `cover` / `url` | from product or scalar override | LineItem / Search keep scalars |
| `referrerCategoryId` / `searchTerm` | `null` | Listing URL args (`searchTerm` else request query `search`) |
| `sizes` / `showLink` / `tag` / `cva` | see component | |

### `Product:Box:Header` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | |
| `href` | derived | `ProductDetailUrlBuilder` when null |
| `referrerCategoryId` / `searchTerm` | `null` | URL args |
| `showRating` | `true` | Gate also needs config + `ratingAverage` → `showRatingBlock` |
| `cva` | `{}` | `Header.cva.twig`: `root`, `rating`, `name` |

### `Product:Box:Body`

| Prop | Default | Notes |
|------|---------|--------|
| `product` | required | |
| `showDescription` | `true` | |
| `cva` | `{}` | `Body.cva.twig`: `root`, `description` |

No root markup when description is off.

### `Product:Box:Footer` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | |
| `href` | derived | `ProductDetailUrlBuilder` when null → Actions |
| `referrerCategoryId` / `searchTerm` | `null` | URL args |
| `showPrice` / `showActions` | `true` | |
| `showVariations` | `true` | → `showVariationsBlock` (skipped for display-parent) |
| `priceShowPrice` | see Box | Forwarded to Price |
| `priceShowTaxNote` | `core.listing.allowBuyInListing` when null | When true, mounts sibling `Product:Price:Tax` |
| `showQuantity` | `false` | Forwarded to Actions → Buy |
| `cva` | `{}` | `Footer.cva.twig`: `root`, `price`, `variations`, `actions` |

### `Product:Box:Actions` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | |
| `href` | `null` | Detail link; Footer passes builder URL |
| `showQuantity` | `false` | Forwarded to Buy |
| `displayBuyButton` | derived | Available ∧ not tiered-from ∧ no children ∧ `core.listing.allowBuyInListing` |
| `cva` | `{}` | `Box/Actions.cva.twig`: `root`, `buy`, `detail` |

Buy when `displayBuyButton`; otherwise Detail (`product` + `href`).

### `Product:Action:Buy` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | Sales channel product |
| `formId` | `ProductBuyForm` + product id | Form `id` (root attr; overridable) |
| `showQuantity` | `true` | Request visible qty control |
| `showQuantityField` | derived | `showQuantity` ∧ not digital-single |
| `productUnit` | derived | Pack unit / plural for QuantityInput `unit` |
| `cva` | `{}` | slots: `root`, `button` |

**Root attrs** (via `attributes.defaults`): `action` → `path('frontend.checkout.line-item.add')`.

**Nests** (no parallel chrome / qty props on Buy):

| Nest | Target | Defaults in `attrs.*.defaults` |
|------|--------|--------------------------------|
| `button:…` | `Button` | submit, icon `handbag`, label/title `listing.boxAddProduct`, color `primary`, size `md` |
| `quantityInput:…` | `QuantityInput` | `inputName` / qty / min / max / steps from `product`; `unit: productUnit` |

Co-located `Buy.js` → `ViewsTheme:Cart:Add`. Overrides: `button:label`, `quantityInput:size`, root `action`, …

### `Product:Actions`

Shared anonymous shell (same Buy/Detail leaves). Not used by Box — prefer `Product:Box:Actions` on the card.

### `Product:Badges` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | Sales channel product (`SalesChannelProductEntity`) |
| `cva` | `{}` | `Badges.cva.twig`: `root`, `discount`, `topseller`, `new` |
| `visible` | derived | Any badge shown; root omitted when false |
| `showDiscount` / `discountPercent` | derived | List-price % when not tier-range and not display-from-variants |
| `showTopseller` / `showNew` | derived | `markAsTopseller` / `isNew` |

Nested overrides: `discount:…`, `topseller:…`, `new:…` (spread into the specialty → `Badge`).

### `Product:Badge:*` / `Badge`

| Component | Role |
|-----------|------|
| `Product:Badge:Discount` | `percentage` → label `N %`; wires `Badge` `type="discount"` |
| `Product:Badge:Topseller` | Default label `listing.boxLabelTopseller`; `type="topseller"` |
| `Product:Badge:New` | Default label `listing.boxLabelNew`; `type="new"` |
| `Badge` | Generic leaf: `type`, `label`, CVA type variants (`badge` / `product-badge` / `badge-*`) |

Not the wishlist/cart count pills (`Wishlist:Action:Badge`, `Cart:Drawer:Action:Badge`).

### CVA slots (`Box.cva.twig`)

`root`, `content`, `header`, `body`, `footer`

Root class uses prop `layout` (`layout-default`, `layout-image`, …). Cover image fit: `--vi-image-fit` / `--vi-image-ar` (default cover / 1:1).

## Behaviour notes

- Listing buy mounts `Product:Action:Buy` via nest+defaults (`showQuantity: false`, `'button:label': false`; hidden min purchase only). Caller overrides: `buy:button:label` / `buy:quantityInput:*` (not parallel props like `buyLabel`)
- `Product:Action:Detail` → `Button` (`type="link"`, `color="light"`, label `listing.boxProductDetails`)
- Detail URLs: `ProductDetailUrlBuilder` (`productId`, optional `search` when child + term, optional `referrerCategoryId`). Owned by **Cover**, **Box:Header**, **Box:Footer** — not Box. Optional `href`/`url` override still wins
- Price math lives in `ProductPriceResolver` → `ProductPriceData` (used by `Product:Price` + `Product:Badges`). Display: cheapest when parent listing, else `calculatedPrices.last` when tiered; “From” prefix when range or variant spread. Discount badge only when list price on last/base, not range, not from-variants. Tier table + tax are parent-mounted siblings (`Product:Price:Tiered` / `Product:Price:Tax`) — not nested in Price. Unit danger color: CVA `unit` variant `hasListPrice`
- Wishlist: Cover `append` when `wishlistEnabled`; `appearance="circle"`; `Product:Action:Wishlist` → `ViewsTheme:Wishlist:Toggle` (theme owner); Button + `aria-pressed` (see [wishlist.md](wishlist.md))
- Badges: Cover `prepend` (no Box image wrapper). Class `Badges.php` owns discount price math + topseller/new flags; empty root omitted when none visible
- Cover root gets `product-image-wrapper` from Box for residual listing positioning (wishlist circle)
- Buy: co-located `Buy.js` → `ViewsTheme:Cart:Add` (theme `Cart` owner); form kept for no-JS. Not core `data-add-to-cart` / OffCanvas. Successful add opens cart drawer via `Cart:Drawer:Action` (`openOnActions` includes `add` by default)

## Known gaps

- Layout variants (`image` / `minimal` / `wishlist`) not separate templates — all render the same Box shell; style via `layout-*` + tokens
- No dedicated Box co-located CSS yet (Cover has CSS)
- Cover children not nest+spread from Box (fixed badges/wishlist mounts)
- `Product:Listing` / `Search:Pagelet` / `Wishlist:Listing` shells not storefront-bridged

## Files

| Role | Path |
|------|------|
| Bridge | `storefront/component/product/card/box.html.twig` |
| Box | `components/Product/Box.{php,html.twig,cva.twig}` |
| Parts | `components/Product/Box/{Header,Footer,Actions}.{php,html.twig,cva.twig}`, `Body.html.twig` (+ `.cva.twig`) |
| Cover | `components/Product/Cover.{php,html.twig,cva.twig,css}` |
| Detail URL | `src/Service/ProductDetailUrlBuilder.php` |
| Price resolve | `src/Service/ProductPriceResolver.php`, `ProductPriceData.php` |
| Actions (shared) | `components/Product/Actions.html.twig` + `Actions.cva.twig` |
| Price | `components/Product/Price.{php,html.twig,cva.twig}`, `Price/{Tiered,Tax}.{html.twig,cva.twig}` |
| Children | `components/Product/{Name,Variations,Description}.html.twig`, `Action/Buy.{php,html.twig,js}`, `Action/{Detail,Wishlist,BuyParameter}.html.twig` |
| Badges | `components/Product/Badges.{php,html.twig,cva.twig}`, `Product/Badge/{Discount,Topseller,New}.{html.twig,cva.twig}` |
| Badge (generic) | `components/Badge.{html.twig,cva.twig}` |
