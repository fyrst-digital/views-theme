# Product box

Listing / CMS product card UI. Core includes `component/product/card/box.html.twig`; the theme bridge mounts UX `Product:Box`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/product/card/box.html.twig` — thin `sw_extends`; replaces core layout switch with `Product:Box` |
| `Product:Box` | Card shell: layout/displayMode/`sizes` resolve + cover overlays + content mounts Header / Body / Footer |
| `Product:Box:Header` | Rating + name (listing). **Not** PDP `Product:Header` (breadcrumb + name) |
| `Product:Box:Body` | Variations + description (omits root when empty) |
| `Product:Box:Footer` | Price + `Product:Actions` |
| `Product:Actions` | Buy **or** Detail (listing rules) |
| `Product:Cover` / `Name` / `Price` / `Badges` / `Variations` / `Description` | Shared product primitives |
| `Product:Action:Buy` / `Detail` / `Wishlist` | Buy form, details Button, wishlist toggle |
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
        <twig:ViewsTheme:Product:Box
            :product="product"
            :layout="layout|default('standard')"
            :displayMode="displayMode|default('standard')"
            :referrerCategoryId="referrerCategoryId|default(null)"
        />
    {% endif %}
{% endblock %}
```

This is an intentional **new** `views/storefront/` bridge (same role as header → `Page:Header:Main`). Do not add further storefront product-card files; extend UX under `components/Product/Box*`.

`Product:Listing` (components shell that also mounts Box) is **not** theme-inherited yet — grid column wrappers stay on core listing.

## Composition

```
Product:Box
  ├─ Product:Cover (url, displayMode, sizes; class product-image-wrapper)
  │    ├─ prepend → Product:Badges
  │    ├─ media
  │    └─ append → Product:Action:Wishlist (if wishlist enabled)
  └─ content
       ├─ Product:Box:Header
       │    ├─ Review:Rating
       │    └─ Product:Name
       ├─ Product:Box:Body
       │    ├─ Product:Variations
       │    └─ Product:Description
       └─ Product:Box:Footer
            ├─ Product:Price
            └─ Product:Actions
                 ├─ Product:Action:Buy   (when buyable in listing)
                 └─ Product:Action:Detail (otherwise)
```

## Props

### `Product:Box`

| Prop | Default | Notes |
|------|---------|--------|
| `product` | required | Sales channel product |
| `layout` | `default` | Core passes `standard` / `image` / `minimal` / `wishlist`; empty/`standard` → `default` (CVA `layout-*`). Only one shell; variants share markup |
| `displayMode` | `standard` | Passed to Cover; image layout + standard → `cover` |
| `sizes` | `null` | Thumbnail sizes; `null` → layout-based default map (incl. `xxl`) |
| `showDescription` / `showVariations` | `true` | Forwarded to Body |
| `showPrice` / `showActions` | `true` | Forwarded to Footer |
| `priceShowPrice` | `true` | Forwarded to Footer → Price |
| `priceShowTieredPrices` | `false` | Listing cards use “From …” + last tier; tier table stays off by default |
| `priceShowTaxNote` | `null` | Forwarded; Footer resolves `null` → `core.listing.allowBuyInListing` |
| `referrerCategoryId` | `null` | Merged into detail `seoUrl` args (with optional `page.searchTerm` when child listing) |
| `cva` | `{}` | Multi-slot via `Box.cva.twig` |

Nested overrides: `header:…`, `body:…`, `footer:…` (and deeper nests on children).

### `Product:Box:Header`

| Prop | Default | Notes |
|------|---------|--------|
| `product` | required | |
| `href` | `null` | Name link URL |
| `showRating` | `true` | Still requires config + `ratingAverage` |
| `cva` | `{}` | `Header.cva.twig`: `root`, `rating`, `name` |

### `Product:Box:Body`

| Prop | Default | Notes |
|------|---------|--------|
| `product` | required | |
| `showVariations` / `showDescription` | `true` | |
| `cva` | `{}` | `Body.cva.twig`: `root`, `variations`, `description` |

No root markup when neither section renders. Variations skipped for display-parent listing.

### `Product:Box:Footer`

| Prop | Default | Notes |
|------|---------|--------|
| `product` | required | |
| `href` | `null` | Detail URL for Actions |
| `showPrice` / `showActions` | `true` | |
| `priceShowPrice` / `priceShowTieredPrices` / `priceShowTaxNote` | see Box | Price flags |
| `showQuantity` | `false` | Forwarded to Actions → Buy |
| `cva` | `{}` | `Footer.cva.twig`: `root`, `price`, `actions` |

### `Product:Actions`

| Prop | Default | Notes |
|------|---------|--------|
| `product` | required | |
| `href` | `null` | Detail link; else `seoUrl` from product |
| `showQuantity` | `false` | Buy quantity field |
| `cva` | `{}` | `Actions.cva.twig`: `root`, `buy`, `detail` |

Buy when available, not tiered-from, no children, and `core.listing.allowBuyInListing`; otherwise Detail.

### CVA slots (`Box.cva.twig`)

`root`, `content`, `header`, `body`, `footer`

Root base includes legacy `product-box` for residual core CSS compatibility. Root class uses `resolvedLayout` (`layout-default`, …).

## Behaviour notes

- Listing buy mounts `Product:Action:Buy` with `:showQuantity="false"` (hidden min purchase only)
- `Product:Action:Detail` → `Button` (`type="link"`, `color="light"`, label `listing.boxProductDetails`)
- Detail URLs: `seoUrl('frontend.detail.page', routeArguments)` with optional `search` + `referrerCategoryId` (core parity); Box passes resolved `href` into Header / Footer
- Price display uses `calculatedPrices.last` when tiered; “From” prefix when `count > 1` (no tier table on box by default)
- Wishlist: Cover `append`, `appearance="circle"`; options default to core `productId` + router add/remove + texts; dual heart icons with core state classes; core `AddToWishlist` plugin
- Badges: Cover `prepend` (no Box image wrapper)
- Cover root gets `product-image-wrapper` from Box for residual listing positioning (wishlist circle)
- Buy: co-located `Buy.js` → `ViewsTheme:Cart:Add` (theme `Cart` owner); form kept for no-JS. Not core `data-add-to-cart` / OffCanvas. Successful add opens cart drawer via `Cart:Drawer:Action` (`openOnAdd` / `openOnActions`)
- Wishlist relies on core plugin (`data-add-to-wishlist`)

## Known gaps

- Layout variants (`image` / `minimal` / `wishlist`) not separate templates — all render the same Box shell
- Root class `layout-*` vs core `box-*` — residual core card CSS may not fully apply
- No dedicated Box co-located CSS yet (Cover has CSS; root may lean on core `product-box`)
- Cover children not nest+spread from Box (fixed badges/wishlist mounts)
- `Product:Listing` / `Search:Pagelet` / `Wishlist:Listing` shells not storefront-bridged

## Files

| Role | Path |
|------|------|
| Bridge | `storefront/component/product/card/box.html.twig` |
| Box | `components/Product/Box.html.twig` + `Box.cva.twig` |
| Parts | `components/Product/Box/{Header,Body,Footer}.html.twig` (+ `.cva.twig` where needed) |
| Actions | `components/Product/Actions.html.twig` + `Actions.cva.twig` |
| Children | `components/Product/{Cover,Badges,Name,Variations,Description,Price}.html.twig`, `Action/{Buy,Detail,Wishlist}.html.twig` |
