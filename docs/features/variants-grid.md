# Variants grid

Paginated variants grid on product detail pages for products with variants.

## Features

- Automatically shows a variants grid on any product detail page that has variants (when active)
- Dynamic columns based on the product's configurator groups
- Quantity input for every variant row
- Single "Add all to cart" button
- Server-side filtering of rows with zero quantity via a dedicated controller
- Seamless lazy-loading pagination via JavaScript fetch (`VariantsGrid:Pagination` → theme `Pagination`)
- Preserved quantities across pagination pages
- Offcanvas cart opens after adding variants, matching default Shopware behavior
- Configurable rows per page via plugin configuration
- Unavailable variants are rendered as disabled rows
- Color/option media rendered as swatches where applicable

## Configuration

Open the plugin configuration in the Shopware administration:

| Setting | Config key | Default |
|---------|------------|---------|
| Active | `ViewsTheme.config.variantsGridActive` | off |
| Rows per page | `ViewsTheme.config.variantsGridRowsPerPage` | `10` |
| Show preview column | `ViewsTheme.config.variantsGridShowPreviewColumn` | on |
| Show product number column | `ViewsTheme.config.variantsGridShowProductNumberColumn` | on |

Both column options apply to the table header and every row, including AJAX-paginated page loads.

See [Configuration](../configuration.md).

## How it works

### Buy container integration

The variants grid is rendered inside the `buy-container` component (`components/product/buy-container.html.twig`) via the `buy_widget_variants_grid` block. The `ProductPageSubscriber` attaches the grid data to the page under `page.extensions.viewsTheme.variantsGrid`.

### Custom controller

The grid form posts to a dedicated controller:

```
frontend.checkout.variants-grid.add
```

This controller receives every row, ignores entries with `quantity <= 0`, creates the remaining line items, and adds them to the cart. The response is handled by Shopware's core `AddToCartPlugin`. Theme product-add → [cart drawer](cart-drawer.md) / badge wiring is a follow-up (alpha).

The same controller also provides an AJAX endpoint for lazy pagination:

```
frontend.checkout.variants-grid.load
```

It returns the rendered table rows and pagination HTML for the requested page. It accepts two optional query parameters (`rowsTemplate`, `paginationTemplate`) for custom Twig templates; both fall back to the defaults if missing or invalid.

### Storefront JavaScript

Co-located `VariantsGrid/Container.js` (`ShopwareComponent` on `data-component="ViewsTheme:VariantsGrid:Container"`) handles button-state management, AJAX pagination, quantity preservation across pages, and error feedback.

### Hooks

| Component | Attribute |
|-----------|-----------|
| Grid container | `data-component="ViewsTheme:VariantsGrid:Container"` |
| Quantity input | `data-component="ViewsTheme:QuantityInput"` |
| Pagination slot | `data-action="pagination"` |
| Quantity memory | `data-action="memory"` |
| Buy submit | `button[type="submit"]` |
| Error | `[role="alert"]` |
| Live region | `[aria-live]` |

See [JavaScript conventions](../conventions/javascript.md).

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/VariantsGridController.php` |
| Loader | `src/Service/VariantsLoader.php` |
| Pagination struct | `src/Struct/VariantsGridPagination.php` |
| Page subscriber | `src/Subscriber/ProductPageSubscriber.php` |
| JS | `src/Resources/views/components/VariantsGrid/Container.js` |
| Templates | `src/Resources/views/components/VariantsGrid/` |
