# Architecture

ViewsTheme is a Shopware 6.7 platform plugin (`fyrst/views-theme`) that acts as a storefront theme and ships storefront features (variants grid, preferred delivery date, search overlay, navigation drawer, cart drawer).

## Identity

| Property | Value |
|----------|-------|
| Technical name | `ViewsTheme` |
| Composer package | `fyrst/views-theme` |
| PHP namespace | `Fyrst\ViewsTheme` |
| Plugin class | `Fyrst\ViewsTheme\ViewsTheme` |
| UX component namespace | `ViewsTheme` |

## Directory layout

```
src/
  ViewsTheme.php
  Controller/
  Service/
  Struct/
  Subscriber/
  Twig/                       # vi_icon, vi_merge_deep
  Resources/
    config/
    theme.json
    views/
      components/             # UX Twig components (primary UI)
      storefront/             # Existing page/layout overrides only
    app/storefront/
      src/                    # Theme SCSS + legacy bundle entry
      dist/
```

## Layers

### Twig

- **UX components** under `views/components/` as `<twig:ViewsTheme:…>` — anonymous by default; optional co-located `Name.php` class components for view-model logic ([UX guide](conventions/ux-components.md#class-components-php-backed)).
- **Page overrides** only in existing `views/storefront/` files.
- **Thin bridges** (exception): new storefront files only when core has no theme override yet and a single include choke-point must mount UX — e.g. product card → [Product box](features/product-box.md), buy-widget → [Buy container](features/buy-container.md), product listing → [Product listing](features/product-listing.md), wishlist listing → [Wishlist](features/wishlist.md), pagination → [Pagination](features/pagination.md), sorting → [Sorting](features/sorting.md), breadcrumb → [Breadcrumb](features/breadcrumb.md), CMS product-description-reviews → [Product reviews](features/review.md) (`Cms:DescriptionReviews`).

### Storefront JS

- Co-located `<Name>.js` next to interactive UX components (`ShopwareComponent` + import map).
- Theme entry `app/storefront/src/main.js` is minimal (no PluginManager plugins remaining).
- Shared / domain JS modules live under `app/storefront/src/modules/` and are imported via `@views-theme/modules/…` (Vite alias) — see [javascript.md](conventions/javascript.md#module-layers).

### SCSS

- Theme styles: `app/storefront/src/scss/` via `theme.json`.

### Listing / filter PHP

| Service | Role |
|---------|------|
| `ProductListingGateway` + `ListingScope` | Single I/O path: category/search × results / catalog aggs / reduced aggs; unified `navigationId` resolution |
| `FilterFacetPipeline` | Catalog resolve + optional availability (SSR Panel + batch options) |
| `FilterRequestSelection` | Request param parse (`splitParam`, selected map) |
| `FilterAvailabilityApplier` | Pure facet mutation from reduced aggs |
| `FilterOptionsPayloadBuilder` | Batch JSON via pipeline + `ComponentHtmlRenderer` |
| `ComponentHtmlRenderer` | UX `createAndRender` + media/SEO placeholders (SoT) |
| `SalesChannelContextAccessor` | Request-stack SCC for class components |

## Page extensions

| Key | Subscriber | Purpose |
|-----|------------|---------|
| `variantsGrid` | `ProductPageSubscriber` | Variants grid payload on PDP |
| `deliveryDate` | `CheckoutConfirmPageSubscriber` | Preferred delivery date field config |

## Storefront routes

ViewsTheme storefront controllers use a dedicated URL path prefix:

| Rule | Detail |
|------|--------|
| Path prefix | **`/vi/…`** |
| Route names | Prefer `frontend.views-theme.*` (feature-specific names OK when already established) |
| Generation | Always `path('route.name')` in Twig — never hardcode paths in JS |
| Avoid | New `/widgets/…` paths (core-style; collision-prone) |

Examples:

| Name | Path |
|------|------|
| `frontend.views-theme.search.overlay` | `/vi/search/overlay` |
| `frontend.views-theme.search.suggest` | `/vi/search/suggest` |
| `frontend.views-theme.navigation.drawer` | `/vi/navigation/drawer` |
| `frontend.views-theme.navigation.drawer.menu` | `/vi/navigation/drawer/menu` |
| `frontend.views-theme.navigation.flyout` | `/vi/navigation/flyout/{navigationId}` |
| `frontend.views-theme.cart.drawer` | `/vi/cart/drawer` |
| `frontend.views-theme.listing.category` | `/vi/listing/category/{navigationId}` |
| `frontend.views-theme.listing.category.aggregations` | `/vi/listing/category/{navigationId}/aggregations` |
| `frontend.views-theme.listing.category.filter-options` | `/vi/listing/category/{navigationId}/filter-options` |
| `frontend.views-theme.listing.search` | `/vi/listing/search` |
| `frontend.views-theme.listing.search.aggregations` | `/vi/listing/search/aggregations` |
| `frontend.views-theme.listing.search.filter-options` | `/vi/listing/search/filter-options` |
| `frontend.views-theme.filter.drawer.category` | `/vi/filter/drawer/category/{navigationId}` |
| `frontend.views-theme.filter.drawer.search` | `/vi/filter/drawer/search` |
| `frontend.views-theme.review.list` | `/vi/product/{productId}/reviews` (GET) |
| `frontend.views-theme.review.save` | `/vi/product/{productId}/reviews` (POST) |

Legacy feature routes (e.g. variants grid under `/checkout/variants-grid/…`) may predate this convention; new routes must use `/vi/…`.

## UX XHR component responses (critical)

XHR controllers that render UX components via `ComponentRendererInterface` **must** run the same SEO/media placeholder replacement as core `StorefrontController::renderStorefront()`.

| Rule | Detail |
|------|--------|
| Use | `AbstractComponentController::renderComponent()` (Response wrapper) |
| SoT | `ComponentHtmlRenderer` (injected) — media always, then SEO when context + storefront host are present |
| Never | `new Response($this->components->createAndRender(…))` without replace |
| Why | `category_url()` / `seoUrl()` emit placeholders (`{domain}/navigation/{id}#`); unresolved → 404 |
| Replace | `MediaUrlPlaceholderHandler` then `SeoUrlPlaceholderHandler` (host = `RequestTransformer::STOREFRONT_URL`) |
| JSON HTML | Filter-options option fragments also go through `ComponentHtmlRenderer::render()` |

Controllers: `CartDrawerController`, `NavigationFlyoutController`, `NavigationDrawerController`, `SearchOverlayController`, `FilterDrawerController`, `ListingController`, `ReviewController`.

Legacy debt: `VariantsGridController` JSON HTML fragments do not use this path yet (`sw_encode_media_url` / `renderView`).

## Theme XHR controllers — data + App hooks

Controllers orchestrate core data into ViewsTheme UX components. They do not reimplement cart/nav/search domain logic.

| Step | Required |
|------|----------|
| 1 | Load via core loader / service (prefer interfaces) |
| 2 | Fire the matching App `*LoadedHook` when core defines one for that DTO |
| 3 | Map DTO → component props (thin) |
| 4 | `renderComponent()` only — never raw `createAndRender` |

| Theme route / controller | Loader | App hook | Notes |
|--------------------------|--------|----------|--------|
| Cart drawer (`CartDrawerController`) | `CheckoutCartPageLoader` | `checkout-cart-page-loaded` (`CheckoutCartPageLoadedHook`) | **Cart page DTO**, not offcanvas widget. Loader also dispatches `CheckoutCartPageLoadedEvent`. |
| Listing results/aggs (`ListingController`) | `ProductListingGateway` → core listing/search routes | *(none on raw listing DTO)* | Results use `no-aggregations`; reduced aggs / filter-options via gateway; [product-listing.md](features/product-listing.md) |
| Filter drawer (`FilterDrawerController`) | `ProductListingGateway` catalog aggs | *(none on raw listing DTO)* | HTML `Filter:Drawer`; [filters.md](features/filters.md) |
| Nav drawer open (`NavigationDrawerController::drawer`) | `MenuOffcanvasPageletLoader` | `menu-offcanvas-pagelet-loaded` | Same offcanvas menu data as core |
| Nav drawer langs/currencies (same action) | `HeaderPageletLoader` | `header-pagelet-loaded` | Header chrome only on full drawer open |
| Nav drawer menu drill (`::menu`) | `MenuOffcanvasPageletLoader` | `menu-offcanvas-pagelet-loaded` | No header load |
| Search suggest (`SearchOverlayController`) | `SuggestPageLoader` | `suggest-page-loaded` | |
| Nav flyout (`NavigationFlyoutController`) | `NavigationLoaderInterface` | *(none — no core pagelet hook)* | Tree API + theme depth math |
| Reviews list/save (`ReviewController`) | `ProductReviewGateway` → `AbstractProductReviewLoader`; save → `AbstractProductReviewSaveRoute` | `product-reviews-widget-loaded` | HTML `Review:Results` / `Review:Panel`; [review.md](features/review.md) |

**Not used for cart drawer:** `OffcanvasCartPageLoader` / `checkout-offcanvas-widget-loaded`. Theme cart UX needs the full cart page shape (summary, shipping calculation, line items). Third parties enriching cart drawer data should use cart-page hooks/events, not offcanvas-widget ones.

## Related

- [Configuration](configuration.md)
- [UX components](conventions/ux-components.md)
- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
- [Search overlay](features/search-overlay.md)
- [Navigation drawer](features/navigation-drawer.md)
- [Navigation bar](features/navigation-bar.md)
- [Cart drawer](features/cart-drawer.md)
- [Filters](features/filters.md)
