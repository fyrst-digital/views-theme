# Cart page

Theme-owned checkout cart page. Replaces core Bootstrap cart chrome with UX components. Mutations stay on always-mounted `Cart`; the page refreshes islands on `Cart:Changed` (no full reload).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/cart/index.html.twig` → `page_checkout` → `Cart:Page` |
| `Cart:Page` | Owner JS: listen `Cart:Changed`, fetch `/vi/cart/page`, swap islands |
| `Cart:Flashes` | Session flash bag (`app.flashes`) via `Alert`; shared with drawer |
| `Cart:Heading` | Title + inline count (`h1`); island. `title` default `checkout.cartHeader` |
| `LineItems:Table` | Table view on this page. Columns: product (image, name, `Product:Variations` badges), qty, line total. `Cart:Empty` when empty. Editable rows put the stepper and remove in the qty cell |
| `Cart:Items` | Stacked list (cart drawer, register aside) |
| `Cart:Page:Aside` | Summary + `Cart:Options` + checkout CTA — **omitted** when empty |
| `Cart:Summary` | Full totals (subtotal, shipping, grand total, net, tax) via `Total`, `Shipping`, `GrandTotal`, `NetTotal`, and `Tax`. Confirm passes per-row `cva`; this page keeps the defaults |
| `Cart:Options` | Shipping pre-calc + promotion form |
| `Cart:Actions` | Checkout only (`cart` nest emptied) |
| `LineItem` | `layout="table"` row inside `LineItems:Table`. Cart page keeps the actions group (stepper and remove) when the line item can be edited and removed |
| `Cart` | HTTP owner (header); page does **not** reload |

## Composition

```
Cart:Page (data-component owner)
├─ Cart:Flashes
├─ Cart:Heading (h1, countDisplay=inline)
├─ [role=alert] (client error)
└─ body (`data-cart-page-body`)
      ├─ LineItems:Table
      │    ├─ header d-none d-lg-grid (Product · Qty · Price)
      │    └─ LineItem layout="table" × N  |  Cart:Empty
      └─ Cart:Page:Aside (when not empty; position-xl-sticky)
          ├─ Cart:Summary
          ├─ Cart:Options
          └─ Cart:Actions (no cart-page link)
```

Desktop (`xl` / 1260px+): items + sticky aside. Mobile: stack.

## Cart:Summary

Shared totals list. This page mounts the row components with their default CVA. Confirm passes a `cva` map into each row — [checkout confirm](checkout-confirm.md).

| Component | Default | Nest |
|-----------|---------|------|
| `Cart:Summary:Total` | `fs-6`; label and value `fw-medium` | `total` (`summary`) |
| `Cart:Summary:Shipping` | same as total; one row per delivery; `label` block | `shipping` |
| `Cart:Summary:GrandTotal` | `fs-5`; label and value `fw-semibold`; value also `vi-cart-summary__grand` | `grand` |
| `Cart:Summary:NetTotal` | `fs-6 text-body-tertiary`; label and value `fw-medium` | `net` |
| `Cart:Summary:Tax` | same as net; one row per rate. An empty `calculatedTaxes` collection still renders one row at 0% (`checkout.summaryTax`, amount 0) | `tax` |

`delivery` and `taxItem` are passed on the tag inside the loops. Blocks stay `total`, `shippings`, `grand_total`, `net_total`, `taxes`. This page does not override `grand_total`, so it has no rule. Confirm does, and renders the `hr` there — [checkout confirm](checkout-confirm.md). The drawer footer mounts `Total` and `Shipping` with its own `cva`, and fills Shipping’s `label` block with `Cart:ShippingCalculation:Open`. Grand total stays off there.

Root is `d-grid align-items-baseline`. CSS is the two-column track (`--vi-cols`), `row-gap: var(--vi-cart-summary-gap, 0)`, and `letter-spacing: var(--vi-cart-summary-tracking, normal)` on `.vi-cart-summary__grand`.

## LineItem `layout`

| Value | Used by | Host |
|-------|---------|------|
| `stacked` (default) | Drawer and register `Cart:Items` | Narrow row: 80px cover (`rounded-2`), content stack, footer (actions group or plain quantity, then line total) |
| `table` | `LineItems:Table` | Below `lg`: the same stacked row, plus the list’s row padding and bottom border. From `lg`: Product / Qty / Price column grid; footer is `display: contents`. The qty cell is `LineItem:Actions` (stepper and remove) or `LineItem:Quantity` (the number). Header from `lg` only. Read-only mounts show the quantity as a number. Delivery window sits under the name in the header, then variations, at every width. From `lg`, image size, row padding, type size, and the area reset are token assigns in `_theme.scss` (`media-breakpoint-up(lg)`). Table padding and the Product / Qty / Total tracks are `--vi-line-items-pad` and `--vi-line-items-cols` in the same file (`32px` qty, `max-content` when `data-show-actions` is true) |

`layout` is forwarded `Cart:Items` or `LineItems:Table` → `LineItem` (`typeProps`) → Product / Promotion / Container / Generic. `LineItem` is a class component: it resolves the leaf with `component()` (product, then the discount heuristic, then container, else generic). Both lists pass `tag="div"` (no `<ul>` / `<li>`).

`showQuantitySelect` and `showRemoveButton` (both default `true`) are forwarded to `LineItem` → Footer. Footer renders `LineItem:Actions` only when both are true, `nestingLevel < 1`, and the line item has `quantityInformation`, is `stackable`, and is `removable`. Otherwise it renders `LineItem:Quantity` (below `lg`: “Quantity” plus the `fw-semibold` amount; from `lg`: the amount only). The two are never both mounted. The cart page table leaves both flags on. The register aside sets both false on `Cart:Items`. Confirm, finish, order details, and edit-order set both false on `LineItems:Table`.

Footer order is the actions group or the number, then the line total. Below `lg` the `table` footer is a flex row (total `ms-auto`); the stepper and remove wrap as one group. From `lg` the `table` footer is `display: contents`, so Actions or Quantity is one grid cell and Price is the next. The qty column is `max-content` when both flags are on (`data-show-actions`) and `32px` otherwise. Header is Product · Qty · Total. Stacked footers keep the total at the end at every width.

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

- `ok === false` → show `[role=alert]`
- `ok` → fetch `pageUrl` and swap by `data-component` identity (scoped to the page root / body)

| Island | Root |
|--------|------|
| `ViewsTheme:Cart:Flashes` | Page |
| `ViewsTheme:Cart:Heading` | Page |
| `ViewsTheme:LineItems:Table` | Page |
| `ViewsTheme:Cart:Page:Aside` | `[data-cart-page-body]` (remove when missing, append when newly present) |

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
