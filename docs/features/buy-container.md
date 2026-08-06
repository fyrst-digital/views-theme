# Buy container

Theme-owned PDP / CMS buy-box UI. Core includes `component/buy-widget/buy-widget.html.twig`; the theme bridge mounts UX `Product:BuyContainer`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/buy-widget/buy-widget.html.twig` — thin `sw_extends`; mounts `Product:BuyContainer` |
| `Product:BuyContainer` | Class-backed buy shell: gates + composition; root keeps BuyBoxPlugin class |
| `Product:Header` | Breadcrumb + name (in container when `showHeader`) |
| `Product:Price` / `Price:Tiered` / `Price:Tax` | Price stack (parent-mounted siblings) |
| `Product:Action:Buy` | Add-to-cart form → cart drawer bus |
| `Product:Action:Wishlist` | PDP wishlist toggle |
| `VariantsGrid:Container` | Multi-variant grid when config + extension present |
| `ProductPageSubscriber` | Attaches `page.extensions.viewsTheme.variantsGrid` on PDP |
| Core delivery / configurator | Included until theme-owned replacements exist |

CMS outer shell (`cms-element-buy-box`, `data-buy-box`) stays **core**. Do not override the element unless the outer wrapper must change.

## Wire-up

Every core call site that includes `buy-widget.html.twig` picks up the theme shell:

- CMS buy-box element (gallery-buybox block)
- Variant switch XHR (`frontend.cms.buybox.switch` → re-renders buy-widget only)
- Any other buy-widget include

```twig
{# storefront/component/buy-widget/buy-widget.html.twig #}
{% sw_extends '@Storefront/storefront/component/buy-widget/buy-widget.html.twig' %}

{% block buy_widget %}
    {% if product %}
        {% set variantsGrid = null %}
        {% if page is defined and page.extensions.viewsTheme is defined %}
            {% set variantsGrid = page.extensions.viewsTheme.variantsGrid|default(null) %}
        {% endif %}

        <twig:ViewsTheme:Product:BuyContainer
            :product="product"
            :configuratorSettings="configuratorSettings|default(null)"
            :totalReviews="totalReviews|default(0)"
            :elementId="elementId|default(null)"
            :pageType="pageType|default(null)"
            :variantsGrid="variantsGrid"
        />
    {% endif %}
{% endblock %}
```

This is an intentional **new** `views/storefront/` bridge (same role as product card → [Product box](product-box.md)). Do not add further storefront buy-widget files; extend UX under `components/Product/BuyContainer*`.

### BuyBoxPlugin

Root must keep the core replace selector:

```html
class="… product-detail-buy"           {# no elementId #}
class="… product-detail-buy-{elementId}" {# CMS buy-box #}
```

Derived as `rootElementClass` on the class component. Outer CMS element keeps `data-buy-box` + options.

## Composition

```
Product:BuyContainer (class VM)
├─ rich snippets (legacy microdata when JSON_LD off)
├─ header → Product:Header (when showHeader)
│    ├─ Breadcrumb
│    └─ Product:Name (h1, no link)
├─ reviews → Review:Rating + review tab link (when showReviewsBlock)
├─ prices
│    ├─ Product:Price:Tiered (when multi-tier)
│    ├─ Product:Price
│    └─ Product:Price:Tax (when showTaxNote)
├─ delivery → core delivery-information include
├─ configurator → core configurator (when parent + settings and not variants grid)
├─ buy
│    ├─ VariantsGrid:Container  XOR
│    └─ Product:Action:Buy
├─ actions → Product:Action:Wishlist (when wishlist enabled)
└─ order number
```

## Props

### `Product:BuyContainer` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | `SalesChannelProductEntity` |
| `configuratorSettings` | `null` | Core buy-box / variant switch payload |
| `totalReviews` | `0` | Review count for reviews block |
| `elementId` | `null` | CMS element id → BuyBoxPlugin root class suffix |
| `pageType` | `null` | Ambient CMS page type (reserved) |
| `variantsGrid` | `null` | From `page.extensions.viewsTheme.variantsGrid` (bridge) |
| `showHeader` | `true` | Mount `Product:Header` — future CMS toggle |
| `showPrice` | `true` | Forwarded to `Product:Price` |
| `showTieredPrices` | `true` | Gate multi-tier table |
| `showTaxNote` | `true` | Mount `Product:Price:Tax` |
| `showBuyForm` | `true` | Mount `Product:Action:Buy` when not variants grid |
| `showActions` | `true` | Actions shell (wishlist) |
| `showReviews` | `true` | Reviews block when config + rating |
| `showOrderNumber` | `true` | SKU row |
| `showDelivery` | `true` | Core delivery include |
| `showConfigurator` | `true` | Core configurator when applicable |
| `cva` | `{}` | Multi-slot via `BuyContainer.cva.twig` |

### Derived (class VM)

| Field | Source |
|-------|--------|
| `rootElementClass` | `product-detail-buy` or `product-detail-buy-{elementId}` |
| `productActive` | `product.active` |
| `wishlistEnabled` | `core.cart.wishlistEnabled` |
| `useVariantsGrid` | config `variantsGridActive` ∧ grid has variants |
| `showTieredBlock` | `showTieredPrices` ∧ `calculatedPrices.count > 1` |
| `showReviewsBlock` | `showReviews` ∧ config ∧ rating ∧ `totalReviews` |
| `showBuyFormBlock` | active ∧ `showBuyForm` ∧ not variants grid |
| `showConfiguratorBlock` | `showConfigurator` ∧ parent ∧ settings ∧ not grid |
| `showWishlistBlock` | `showActions` ∧ wishlist enabled |
| `showOrderNumberBlock` | `showOrderNumber` ∧ product number |

Nested overrides: `header:…`, `buy:…`, `wishlist:…`, and DOM nests (`reviews`, `prices`, `actions`, …).

## Variants grid

When `ViewsTheme.config.variantsGridActive` and `variantsGrid.variants` is non-empty:

1. Core configurator is **not** mounted
2. Single `Product:Action:Buy` is **not** mounted
3. `VariantsGrid:Container` is mounted instead

See [Variants grid](variants-grid.md). Data is attached on PDP by `ProductPageSubscriber`; the bridge forwards it as `variantsGrid`. Variant XHR re-renders may lack `page` — grid then stays off until full navigation.

## Related children

| Child | Doc |
|-------|-----|
| `Product:Action:Buy` | [Product box](product-box.md) (shared API) |
| `Product:Price*` | [Product box](product-box.md) |
| Wishlist | [Wishlist](wishlist.md) |
| Header / breadcrumb | [Breadcrumb](breadcrumb.md) |
| Cart add bus | [Cart drawer](cart-drawer.md) |

## Future (out of scope)

- CMS buy-box config toggle for `showHeader` (and other show* flags)
- Theme-owned delivery / configurator components
- Variants grid → `ViewsTheme:Cart:Add` bus (still core AddToCart path)

## Key source files

| Area | Path |
|------|------|
| Bridge | `src/Resources/views/storefront/component/buy-widget/buy-widget.html.twig` |
| Shell | `src/Resources/views/components/Product/BuyContainer.{php,html.twig,cva.twig}` |
| Header | `src/Resources/views/components/Product/Header.html.twig` |
| Buy action | `src/Resources/views/components/Product/Action/Buy.*` |
| Variants data | `src/Subscriber/ProductPageSubscriber.php` |
