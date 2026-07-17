# Variants grid

Paginated variants grid on product detail pages for products with variants.

## Features

- Automatically shows a variants grid on any product detail page that has variants (when active)
- Dynamic columns based on the product's configurator groups
- Quantity input for every variant row
- Single "Add all to cart" button
- Server-side filtering of rows with zero quantity via a dedicated controller
- Seamless lazy-loading pagination via JavaScript fetch
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

This controller receives every row, ignores entries with `quantity <= 0`, creates the remaining line items, and adds them to the cart. The response is handled by Shopware's core `AddToCartPlugin`, which opens the offcanvas cart.

The same controller also provides an AJAX endpoint for lazy pagination:

```
frontend.checkout.variants-grid.load
```

It returns the rendered table rows and pagination HTML for the requested page. It accepts two optional query parameters (`rowsTemplate`, `paginationTemplate`) for custom Twig templates; both fall back to the defaults if missing or invalid.

### Storefront JavaScript

The `VariantsGridPlugin` (registered on `[data-component="variants-grid"]`) handles button-state management, AJAX pagination, quantity preservation across pages, and error feedback.

### `data-component` hooks

| Component | Attribute |
|-----------|-----------|
| Grid container | `data-component="variants-grid"` |
| Grid body | `data-component="grid-body"` |
| Pagination | `data-component="pagination"` |
| Quantity input | `data-component="quantity-input"` |
| Buy button | `data-component="buy-button"` |
| Grid memory | `data-component="grid-memory"` |
| Live region | `data-component="live-region"` |
| Error message | `data-component="error-message"` |

See [JavaScript conventions](../conventions/javascript.md).

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/VariantsGridController.php` |
| Loader | `src/Service/VariantsLoader.php` |
| Pagination struct | `src/Struct/VariantsGridPagination.php` |
| Page subscriber | `src/Subscriber/ProductPageSubscriber.php` |
| JS plugin | `src/Resources/app/storefront/src/plugins/variants-grid.plugin.js` |
| Templates | `src/Resources/views/components/variants-grid/` |
