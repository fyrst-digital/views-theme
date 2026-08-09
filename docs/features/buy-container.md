# Buy container

Theme-owned PDP / CMS buy-box UI. Core includes `component/buy-widget/buy-widget.html.twig`; the theme bridge mounts UX `Product:BuyContainer`.

SEO structured data is page-level JSON-LD only (no buy-box microdata).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/component/buy-widget/buy-widget.html.twig` — thin `sw_extends`; mounts `Product:BuyContainer` |
| `Product:BuyContainer` | Class-backed buy shell: gates + composition; root keeps BuyBoxPlugin class |
| `Product:Header` | Manufacturer + name + SKU + Rating (in container when `showHeader`) |
| `Product:Manufacturer` | Brand name text only; self-gated |
| `Product:SKU` | Product number + label; self-gated |
| `Product:Rating` | Rating summary (via Header; self-gated `visible`) |
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
│    ├─ manufacturer → Product:Manufacturer (when name)
│    ├─ name → Product:Name (PDP: h1, no link via name:*)
│    ├─ sku → Product:SKU (when number)
│    └─ rating → Product:Rating (when visible)
│         ├─ Review:Rating
│         └─ label
├─ prices → Product:Prices
│    ├─ Product:Price:Tiered (when multi-tier)
│    ├─ Product:Price
│    └─ Product:Price:Tax (when showTaxNote)
├─ delivery → core delivery-information include
├─ configurator → core configurator (when parent + settings and not variants grid)
├─ buy
│    ├─ VariantsGrid:Container  XOR
│    └─ Product:Action:Buy
└─ actions → Product:Actions (when showActions)
     └─ Product:Action:Wishlist (when wishlistEnabled)
```

## Props

### `Product:BuyContainer` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | `SalesChannelProductEntity` |
| `configuratorSettings` | `null` | Core buy-box / variant switch payload |
| `totalReviews` | `0` | Forwarded to Header → `Product:Rating` |
| `elementId` | `null` | CMS element id → BuyBoxPlugin root class suffix |
| `pageType` | `null` | Ambient CMS page type (reserved) |
| `variantsGrid` | `null` | From `page.extensions.viewsTheme.variantsGrid` (bridge) |
| `showHeader` | `true` | Mount `Product:Header` (incl. rating) — future CMS toggle |
| `showPrice` | `true` | PHP default only — Twig forces XOR from `calculatedPrices` (see below) |
| `showTieredPrices` | `true` | PHP default only — Twig forces XOR from `calculatedPrices` (see below) |
| `showTaxNote` | `true` | Forwarded to `Product:Prices` |
| `showBuyForm` | `true` | Mount `Product:Action:Buy` when not variants grid |
| `showActions` | `true` | Mount `Product:Actions` |
| `showReviews` | `true` | Forwarded to Header → `Product:Rating` |
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
| Prices XOR (Twig) | `showPrice` = single/empty `calculatedPrices`; `showTieredPrices` = `count > 1` — caller props are not passed through |

Nested overrides: `header:…` (incl. `header:manufacturer:…`, `header:name:…`, `header:sku:…`, `header:rating:…`), `prices:…`, `buy:…`, `actions:…` (incl. `actions:wishlist:…`), and DOM nests (`delivery`, …).

### `Product:Header` (anonymous)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | Forwarded to children |
| `showManufacturer` | `true` | Mount manufacturer block |
| `showSku` | `false` | Mount sku block |
| `totalReviews` | `0` | Forwarded to `Product:Rating` |
| `showReviews` | `true` | Forwarded to `Product:Rating` |
| `cva` | `{}` | `Header.cva.twig`: `root`, `manufacturer`, `name`, `sku`, `rating` |

Nests: `manufacturer`, `name` (defaults `showLink: true`, `tag: 'div'`), `sku`, `rating` (`Product:Rating`; self-gated). BuyContainer sets `totalReviews`, `showReviews`, `'name:showLink': false`, `'name:tag': 'h1'`.

### `Product:Manufacturer` (anonymous)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | `null` | Source for name |
| `name` | from manufacturer | Root omitted when empty |
| `tag` | `'div'` | Root element |
| `cva` | `{}` | `Manufacturer.cva.twig`: `root` |

Plain brand name text. No logo/media.

### `Product:SKU` (anonymous)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | `null` | Source for number |
| `number` | `product.productNumber` | Root omitted when empty |
| `showLabel` | `true` | Mount label nest |
| `label` | `detail.productNumberLabel` | Snippet |
| `cva` | `{}` | `SKU.cva.twig`: `root`, `label`, `value` |

Nests: `label`, `value`. No foot SKU on BuyContainer — only via Header.

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
| `showTieredPrices` | `true` | Mount Tiered when `calculatedPrices.count > 1` |
| `showTaxNote` | `true` | Mount `Product:Price:Tax` |
| `cva` | `{}` | `Prices.cva.twig`: `root`, `tiered`, `price`, `tax` |

Nests: `tiered`, `price`, `tax`.

### `Product:Rating` (class-backed)

Mounted by `Product:Header` (not BuyContainer). Root omitted when not `visible`.

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | |
| `totalReviews` | `0` | |
| `showReviews` | `true` | Caller gate |
| `size` | `'md'` | Forwarded to `Review:Rating` (`sm`/`md`/`lg`); BuyContainer Header always passes `size: 'sm'` |
| `visible` | derived | `showReviews` ∧ config ∧ rating ∧ `totalReviews` |
| `average` | derived | `product.ratingAverage` |
| `cva` | `{}` | `Rating.cva.twig`: `root`, `rating`, `label` |

Nests: `rating` (`Review:Rating`), `label`. Override via `header:rating:…`.

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
| Page breadcrumb | [Breadcrumb](breadcrumb.md) (layout / CMS — not in Header) |
| Cart add bus | [Cart drawer](cart-drawer.md) |

## Future (out of scope)

- CMS buy-box config toggle for `showHeader` (and other show* flags)
- Theme-owned delivery / configurator components
- Variants grid → `ViewsTheme:Cart:Add` bus (still core AddToCart path)
- `Box:Footer` adopting `Product:Prices`
- Manufacturer logo / CMS manufacturer-logo element

## Key source files

| Area | Path |
|------|------|
| Bridge | `src/Resources/views/storefront/component/buy-widget/buy-widget.html.twig` |
| Shell | `src/Resources/views/components/Product/BuyContainer.{php,html.twig,cva.twig}` |
| Header | `src/Resources/views/components/Product/Header.{html.twig,cva.twig}` |
| Manufacturer | `src/Resources/views/components/Product/Manufacturer.{html.twig,cva.twig}` |
| SKU | `src/Resources/views/components/Product/SKU.{html.twig,cva.twig}` |
| Prices stack | `src/Resources/views/components/Product/Prices.*` |
| Rating summary | `src/Resources/views/components/Product/Rating.*` |
| Secondary actions | `src/Resources/views/components/Product/Actions.*` |
| Buy action | `src/Resources/views/components/Product/Action/Buy.*` |
| Variants data | `src/Subscriber/ProductPageSubscriber.php` |
