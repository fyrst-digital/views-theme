# Buy container

Theme-owned PDP / CMS buy-box UI. Core includes `component/buy-widget/buy-widget.html.twig`; the theme bridge mounts UX `Product:BuyContainer`.

SEO structured data is page-level JSON-LD only (no buy-box microdata).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/buy-widget/buy-widget.html.twig` — thin `sw_extends`; mounts `Product:BuyContainer` |
| `Product:BuyContainer` | Class-backed buy shell: gates + composition; root keeps BuyBoxPlugin class |
| `Product:Header` | Breadcrumb + name (in container when `showHeader`) |
| `Product:Reviews` | Rating summary + review-tab link (self-gated `visible`) |
| `Product:Prices` | Price stack shell: Tiered + Price + Tax |
| `Product:Price` / `Price:Tiered` / `Price:Tax` | Leaves (parent-mounted by Prices) |
| `Product:Action:Buy` | Add-to-cart form → cart drawer bus |
| `Product:Actions` | Secondary actions shell (wishlist, …) |
| `Product:Action:Wishlist` | Wishlist toggle (via Actions) |
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
├─ header → Product:Header (when showHeader)
│    ├─ Breadcrumb
│    └─ Product:Name (h1, no link)
├─ reviews → Product:Reviews (when visible)
│    ├─ Review:Rating
│    └─ label + review tab link
├─ prices → Product:Prices
│    ├─ Product:Price:Tiered (when multi-tier)
│    ├─ Product:Price
│    └─ Product:Price:Tax (when showTaxNote)
├─ delivery → core delivery-information include
├─ configurator → core configurator (when parent + settings and not variants grid)
├─ buy
│    ├─ VariantsGrid:Container  XOR
│    └─ Product:Action:Buy
├─ actions → Product:Actions (when showActions)
│    └─ Product:Action:Wishlist (when visible)
└─ order number
```

## Props

### `Product:BuyContainer` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | `SalesChannelProductEntity` |
| `configuratorSettings` | `null` | Core buy-box / variant switch payload |
| `totalReviews` | `0` | Forwarded to `Product:Reviews` |
| `elementId` | `null` | CMS element id → BuyBoxPlugin root class suffix |
| `pageType` | `null` | Ambient CMS page type (reserved) |
| `variantsGrid` | `null` | From `page.extensions.viewsTheme.variantsGrid` (bridge) |
| `showHeader` | `true` | Mount `Product:Header` — future CMS toggle |
| `showPrice` | `true` | Forwarded to `Product:Prices` |
| `showTieredPrices` | `true` | Forwarded to `Product:Prices` |
| `showTaxNote` | `true` | Forwarded to `Product:Prices` |
| `showBuyForm` | `true` | Mount `Product:Action:Buy` when not variants grid |
| `showActions` | `true` | Mount `Product:Actions` |
| `showReviews` | `true` | Forwarded to `Product:Reviews` |
| `showOrderNumber` | `true` | SKU row |
| `showDelivery` | `true` | Core delivery include |
| `showConfigurator` | `true` | Core configurator when applicable |
| `cva` | `{}` | Multi-slot via `BuyContainer.cva.twig` |

### Derived (BuyContainer VM)

| Field | Source |
|-------|--------|
| `rootElementClass` | `product-detail-buy` or `product-detail-buy-{elementId}` |
| `productActive` | `product.active` |
| `useVariantsGrid` | config `variantsGridActive` ∧ grid has variants |
| `showBuyFormBlock` | active ∧ `showBuyForm` ∧ not variants grid |
| `showConfiguratorBlock` | `showConfigurator` ∧ parent ∧ settings ∧ not grid |
| `showOrderNumberBlock` | `showOrderNumber` ∧ product number |

Nested overrides: `header:…`, `reviews:…`, `prices:…`, `buy:…`, `actions:…` (incl. `actions:wishlist:…`), and DOM nests (`delivery`, …).

### `Product:Actions` (class-backed)

Secondary product actions (not listing Buy/Detail — that is `Product:Box:Actions`). Parent gates mount via BuyContainer `showActions`.

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | → `productId` |
| `productId` | derived | From product |
| `wishlistEnabled` | derived | Config ∧ product id — root + wishlist only when true |
| `cva` | `{}` | `Actions.cva.twig`: `root`, `wishlist` |

Nest: `wishlist` (PDP defaults: `showText: true`, `size: 'sm'`).

### `Product:Prices` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | |
| `showPrice` | `true` | → `Product:Price` |
| `showTieredPrices` | `true` | Gate multi-tier table |
| `showTaxNote` | `true` | Mount `Product:Price:Tax` |
| `showTieredBlock` | derived | `showTieredPrices` ∧ `calculatedPrices.count > 1` |
| `cva` | `{}` | `Prices.cva.twig`: `root`, `tiered`, `price`, `tax` |

Nests: `tiered`, `price`, `tax`.

### `Product:Reviews` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | |
| `totalReviews` | `0` | |
| `showReviews` | `true` | Caller gate |
| `visible` | derived | `showReviews` ∧ config ∧ rating ∧ `totalReviews` |
| `average` | derived | `product.ratingAverage` |
| `remoteClickOptions` / `reviewTabHref` | derived | Core review-tab selectors |
| `cva` | `{}` | `Reviews.cva.twig`: `root`, `rating`, `label`, `link` |

Root omitted when not `visible`. Nests: `rating`, `label`, `link`.

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
| `Product:Price*` / `Product:Prices` | [Product box](product-box.md) · this page |
| Wishlist | [Wishlist](wishlist.md) |
| Header / breadcrumb | [Breadcrumb](breadcrumb.md) |
| Cart add bus | [Cart drawer](cart-drawer.md) |

## Future (out of scope)

- CMS buy-box config toggle for `showHeader` (and other show* flags)
- Theme-owned delivery / configurator components
- Variants grid → `ViewsTheme:Cart:Add` bus (still core AddToCart path)
- `Box:Footer` adopting `Product:Prices`

## Key source files

| Area | Path |
|------|------|
| Bridge | `src/Resources/views/storefront/component/buy-widget/buy-widget.html.twig` |
| Shell | `src/Resources/views/components/Product/BuyContainer.{php,html.twig,cva.twig}` |
| Prices stack | `src/Resources/views/components/Product/Prices.*` |
| Reviews summary | `src/Resources/views/components/Product/Reviews.*` |
| Secondary actions | `src/Resources/views/components/Product/Actions.*` |
| Header | `src/Resources/views/components/Product/Header.html.twig` |
| Buy action | `src/Resources/views/components/Product/Action/Buy.*` |
| Variants data | `src/Subscriber/ProductPageSubscriber.php` |
