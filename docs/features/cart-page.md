# Cart page

Theme-owned checkout cart page. Replaces core Bootstrap cart chrome with UX components. Mutations stay on always-mounted `Cart`; the page refreshes islands on `Cart:Changed` (no full reload).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/cart/index.html.twig` → `page_checkout` → `Cart:Page` |
| `Cart:Page` | Owner JS: listen `Cart:Changed`, fetch `/vi/cart/page`, swap islands |
| `Cart:Flashes` | Session flash bag (`app.flashes`) via `Alert`; shared with drawer. With `clientError` (the page sets it) it also holds a `<template>` with the default danger `Alert` (`error.message-default`), which `Cart:Page` mounts when a cart change fails |
| `Page:Title` | Page title (`h1` “Shopping cart” with the item count in the meta line). Reuses the shared atomic page title; `Cart:Page` passes `heading` (`checkout.cartHeader`) and `meta.items` (`checkout.itemCounter`, e.g. “6 items”; omitted when the cart is empty) and sets `data-component="ViewsTheme:Cart:Heading"` so the island swap keeps working |
| `Cart:Heading` | Cart drawer title only (inline count, `div`); island inside `Cart:Drawer:Heading` |
| `LineItems:Table` | Table view on this page. Columns: product (image, name, `Product:Variations` badges), qty, line total. `Cart:Empty` when empty. Editable rows put the stepper and remove in the qty cell |
| `Cart:Items` | Stacked list (cart drawer, register aside) |
| `Cart:Page:Aside` | Sticky island root (`div`, `data-component`) containing `Cart:Shipping` (nest `shipping`, above) and one [`Summary:Box`](summary-box.md) (nest `box`) that groups a `heading` (`h2`, `checkout.summaryHeader`, same typography as the confirm summary) + Summary + `Cart:Options` (promotion only) + checkout CTA (slots are `vi_block`s) — **omitted** when empty. The root keeps `d-flex flex-column gap-6 position-xl-sticky`; the box supplies chrome and the 20px body gap |
| `Cart:Summary` | Full totals (subtotal, shipping, grand total, net, tax) via `Total`, `Shipping`, `GrandTotal`, `NetTotal`, and `Tax`. Row styling lives in each row component’s default CVA, shared by every consumer |
| `Cart:Shipping` | Dedicated card above the summary box (same chrome as [`Checkout:Additions`](checkout-confirm.md): border, `rounded-4`, `p-5`, `fs-4` title `checkout.shippingDetailsHeader`, “Shipping details”). Mounts `Shipping:Calculation`, which is always open. Omitted without a physical line item. The callers (`Cart:Page:Aside`, `Cart:Drawer:Body`) skip it when `ViewsTheme.config.checkoutShippingCalculationActive` is off — the component itself does not read the config. Island (`data-component="ViewsTheme:Cart:Shipping"`), shared with the cart drawer |
| `Cart:Options` | Shipping pre-calc + promotion form. The page empties the `shipping` block (shipping lives in `Cart:Shipping`); the drawer keeps both |
| `Cart:Actions` | Checkout only (`cart` nest emptied) |
| `LineItem` | `layout="table"` row inside `LineItems:Table`. Cart page keeps the actions group (stepper and remove) when the line item can be edited and removed |
| `Cart` | HTTP owner (header); page does **not** reload |

## Composition

```
Cart:Page (data-component owner; .grid, grid-columns-1 / xl-8 / xxl-12)
├─ Cart:Flashes                          (g-col-1 g-col-xl-8 g-col-xxl-12; flash bag + client-error template)
├─ Page:Title                        (g-col-1 g-col-xl-8 g-col-xxl-12; h1 heading prop + meta.items, data-component=ViewsTheme:Cart:Heading)
├─ LineItems:Table                       (g-col-1 g-col-xl-5 g-col-xxl-8; full row when empty)
│    ├─ Product / Qty / Total (d-none d-lg-block; Product spans 2)
│    ├─ Divider (header, d-none d-lg-block)
│    └─ LineItem layout="table" d-lg-contents × N, then Divider after each row except the last (every viewport)  |  Cart:Empty
└─ Cart:Page:Aside                       (div root; when not empty; g-col-1 g-col-xl-3 g-col-xxl-4; position-xl-sticky, align-self-start)
    ├─ Cart:Shipping → Shipping:Calculation (always open; physical carts only)
    └─ Summary:Box
        ├─ h2 heading (checkout.summaryHeader)
        ├─ Cart:Summary
        ├─ Cart:Options (shipping block emptied → promotion only)
        └─ Cart:Actions (no cart-page link)
```

The page root is the layout grid, the same one as [`Checkout:Confirm`](checkout-confirm.md): `d-grid grid grid-columns-1 grid-columns-xl-8 grid-columns-xxl-12 row-gap-7 column-gap-xl-9`. There is no body wrapper. Every direct child gets its span from the `Cart:Page` CVA, never from the child's own CVA.

Desktop (`xl` / 1260px+): eight tracks. Flashes and the title span the row. `LineItems:Table` is `g-col-xl-5` (`g-col-xxl-8` from `xxl`) and the sticky aside is `g-col-xl-3` (`g-col-xxl-4`); both are `align-self-start`. An empty cart has no aside, so the table spans the full row (`empty` variant on `items`). Row gap 32px, column gap 64px. Mobile: one track, children stack.

## Cart:Summary

Shared totals list. The row defaults below follow the confirm summary design and are shared by every consumer (cart page, confirm, register / success / edit-order asides, drawer). Callers only override per row where they differ (the drawer footer does) — [checkout confirm](checkout-confirm.md).

| Component | Default | Nest |
|-----------|---------|------|
| `Cart:Summary:Total` | `fs-5`; label `fw-medium text-muted`; value `fw-semibold` | `total` (`summary`) |
| `Cart:Summary:Shipping` | same as total; one row per delivery; `label` block. Under the label it shows that delivery’s shipping method name (`delivery.shippingMethod.translated.name`, nest/CVA `method`: `d-block fs-6 fw-normal text-body-tertiary`), omitted when the method is missing. Every consumer (cart page, drawer, confirm, register, success) gets it from this one component | `shipping` |
| `Cart:Summary:GrandTotal` | `fs-5`; label `fw-semibold`; value `vi-cart-summary__grand fs-3 fw-bold` | `grand` |
| `Cart:Summary:NetTotal` | `fs-6 text-muted`; label and value `fw-normal` | `net` |
| `Cart:Summary:Tax` | same as net; one row per rate. An empty `calculatedTaxes` collection still renders one row at 0% (`checkout.summaryTax`, amount 0) | `tax` |

`delivery` and `taxItem` are passed on the tag inside the loops. Blocks stay `total`, `shippings`, `grand_total`, `net_total`, `taxes`. The `grand_total` block renders a `Divider` inside its own `grand_total_divider` block (override or empty it from a caller) (nest `divider`, CVA `my-2`, spanning both tracks via `--vi-divider-col`) before `GrandTotal`, for every consumer. It is hidden together with the grand total (`showGrandTotal=false`, as in the drawer footer). The drawer footer mounts `Total` and `Shipping` with its own `cva`, and fills Shipping’s `label` block with `Shipping:Calculation:Open`. Grand total stays off there.

Root is `d-grid align-items-center`. CSS is the two-column track (`--vi-cols`), `row-gap: var(--vi-cart-summary-gap, 0)`, and `letter-spacing: var(--vi-cart-summary-tracking, normal)` on `.vi-cart-summary__grand`.

## LineItem `layout`

| Value | Used by | Host |
|-------|---------|------|
| `stacked` (default) | Drawer and register `Cart:Items` | Narrow row: 80px cover (`rounded-2`), content stack, footer (actions group or plain quantity, then line total) |
| `table` | `LineItems:Table` | `.vi-line-items-table` (`role="table"` when not empty) is `d-grid` at every width. Below `lg`: the same stacked row, plus the list’s row padding. The host track is `minmax(0, 1fr)`, so each row and the `Divider` sibling (`itemLine`, except after the last) is a full-width cell. From `lg`: `--vi-line-items-cols` is `auto minmax(0, 1fr) auto auto` and the line item root is `display: contents`, so cover, content, qty, and price are cells of that grid. That same row `Divider` (`--vi-divider-col`, default `1 / -1`) is the next grid cell, after the line item. Footer stays `display: contents`, so the qty cell is `LineItem:Actions` (stepper and remove) or `LineItem:Quantity` (the number) and Price is the next cell. Column labels are direct children of the table (Product spans the cover and content tracks, then Qty and Total), from `lg` only, followed by a header `Divider` on the same track (`d-none d-lg-block`). Read-only mounts show the quantity as a number. Delivery window sits under the name in the header, then variations, at every width. From `lg`, image size and the area reset are token assigns in `_theme.scss` (`media-breakpoint-up(lg)`). Padding is `p-4` on that host. The base track fallback is `minmax(0, 1fr)` on `.vi-line-items-table`; the four tracks are the `lg` assign above. Row gap is `row-gap-lg-4` (16px from `lg`) |

`layout` is forwarded `Cart:Items` or `LineItems:Table` → `LineItem` (`typeProps`) → Product / Promotion / Container / Generic. `LineItem` is a class component: it resolves the leaf with `component()` (product, then the discount heuristic, then container, else generic). Both lists pass `tag="div"` (no `<ul>` / `<li>`). `Cart:Items` (stacked) separates rows the same way the table does: a `Divider` (nest `itemLine`, `aria-hidden`) after every row except the last, with `gap-4` around it.

`showQuantitySelect` and `showRemoveButton` (both default `true`) are forwarded to `LineItem` → Footer. Footer renders `LineItem:Actions` only when both are true, `nestingLevel < 1`, and the line item has `quantityInformation`, is `stackable`, and is `removable`. Otherwise it renders `LineItem:Quantity` (below `lg`: “Quantity” plus the `fw-semibold` amount; from `lg`: the amount only). The two are never both mounted. The cart page table leaves both flags on. The register aside sets both false on `Cart:Items`. `Cart:Items` forwards the `item` nest to each `LineItem`. The aside uses it to replace the quantity label CVA (`item:footer:quantity:cva` → `label: 'vi-line-item-quantity__label text-muted'`), which drops the table-only `d-lg-none`, so “Quantity” stays visible from `lg` in the stacked list. Confirm, finish, order details, and edit-order set both false on `LineItems:Table`.

Footer order is the actions group or the number, then the line total. Below `lg` the `table` footer is a flex row (total `ms-auto`); the stepper and remove wrap as one group. From `lg` the line item root and the `table` footer are `display: contents`, so cover, content, Actions or Quantity, and Price share the table tracks. The row separator is that `Divider` at every viewport. There is no border on the line item host, and no rule after the last row. Qty and total tracks are `auto`, sized by the cell content. A promotion price uses `grid-column: -2 / -1` so it stays on the last explicit track. Header is Product · Qty · Total. Stacked footers keep the total at the end at every width.

## Controller

| Route name | Path | Method | Renders |
|------------|------|--------|---------|
| `frontend.views-theme.cart.page` | `/vi/cart/page` | `GET` (XHR) | `ViewsTheme:Cart:Page` |

| Piece | Detail |
|-------|--------|
| Loader | `CheckoutCartPageLoader` — same DTO as the storefront cart page |
| App hook | `CheckoutCartPageLoadedHook` (`checkout-cart-page-loaded`) after load, before render |
| Render | `AbstractComponentController::renderComponent()` → `ViewsTheme:Cart:Page` with prop `page` |

Used for in-page island refresh. Same data/hooks as [cart drawer](cart-drawer.md).

## Owner JS (`Cart:Page.js`)

On `ViewsTheme:Cart:Changed`:

- `ok === false` (or a failed refresh) → clone the `Cart:Flashes` `<template>` into the Flashes root and unhide it. The next successful refresh swaps Flashes and clears it. The server error text is not shown
- `ok` → fetch `pageUrl` and swap by `data-component` identity (scoped to the page root / body)

| Island | Root |
|--------|------|
| `ViewsTheme:Cart:Flashes` | Page |
| `ViewsTheme:Cart:Heading` | Page (root is `Page:Title`) |
| `ViewsTheme:LineItems:Table` | Page |
| `ViewsTheme:Cart:Page:Aside` | Page (remove when missing; append when newly present — it is the last grid child) |

Busy/queue/abort + island swap match drawer Body (`parseHtmlFragment` + `data-component` identity). Swap stays scoped so drawer + page can both be open.

## Hooks

| Component | Attribute |
|-----------|-----------|
| Page owner | `data-component="ViewsTheme:Cart:Page"` |
| Flashes / Heading | `data-component="ViewsTheme:Cart:…"` |
| Items | `data-component="ViewsTheme:LineItems:Table"` |
| Aside | `data-component="ViewsTheme:Cart:Page:Aside"` |

Page options (`data-component-options`): `pageUrl`.

## Out of scope

- Add-by-number / `Cart:AddProductForm`
- Finish / success page — [checkout-success](checkout-success.md)
- Wishlist on line items
- PayPal express / installment (core/PayPal inner blocks are not preserved)
- Hidden GA line-item dump

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/CartPageController.php` |
| Page | `src/Resources/views/components/Cart/Page.*` |
| Aside | `src/Resources/views/components/Cart/Page/Aside.*` |
| Items table | `src/Resources/views/components/LineItems/Table.*` |
| Shared islands | `src/Resources/views/components/Cart/{Flashes,Items,Heading}.*` |
| Bridge | `src/Resources/views/storefront/page/checkout/cart/index.html.twig` |

## Related

- [Cart drawer](cart-drawer.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Architecture — UX XHR](../architecture.md#ux-xhr-component-responses-critical)
