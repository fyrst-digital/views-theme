# Checkout success

Theme-owned `/checkout/finish` (`frontend.checkout.finish.page`). Guest login, `paymentFailed` → edit-order, and guest logout stay in core `CheckoutController`.

UX tags are **`Checkout:Success`** (branch / theme name). Shopware’s route and storefront path stay `checkout/finish`.

Unlike [cart page](cart-page.md), **`Checkout:Success` has no `data-component` / no island JS / no `/vi/…`**. Recap is read-only: order DTO (`page.order`), not the cart.

Does **not** own account edit-order / complete-payment. That page is [`Account:Order:Edit`](account.md) — see [checkout confirm](checkout-confirm.md#edit-order-isolation).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/finish/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Success` |
| `Page:Header:Minimal` | Inline header (no ESI): `Page:Logo` + `header.supportInfo` + `Button` home |
| `Checkout:Success` | Layout composer — flashes, thank-you header, addresses, methods, grid items, comment + preferred date, aside |
| `Checkout:Success:Header` | `checkout.finishHeader` / `finishUpdateHeader`, order number (`data-order-number`), confirmation-mail teaser, changed-payment subtitle, Google enhanced conversions, hidden line-item dump |
| `Checkout:Success:Addresses` | Shim → [`Order:Addresses`](account.md) (order billing/shipping → [`Address:List`](address.md)). No `Address:Manager:Action` |
| `Checkout:Success:Payment` / `:Shipping` | Class VM. One selected `Checkout:Method` (`interactive=false`). Shipping omitted when the order has no delivery |
| `Checkout:Method` | Radio primitive; `interactive=false` drops the input and uses a `div` instead of `label` |
| `Cart:Items` | Grid, `showRemoveButton=false`, `showQuantitySelect=false`, `lineItems` = `page.order.nestedLineItems`, `cart` = `page.order` |
| `Checkout:Success:Comment` | Read-only `page.order.customerComment` (no localStorage, no textarea) |
| `Checkout:Success:DeliveryDate` | Read-only preferred date from the order custom field ([delivery-date](delivery-date.md)) |
| `Checkout:Success:Aside` | Sticky summary. `Cart:Summary` with `summary: page.order`. No TOS / place-order |
| Footer | [`Page:Footer:Minimal`](footer.md) via `base_esi_footer` (inline, no ESI) |

Do **not** add `storefront/layout/header/header-minimal.html.twig` or `storefront/layout/footer/footer-minimal.html.twig`. Footer: [footer](footer.md).

## Composition

```
page/checkout/finish/index.html.twig
├─ base_esi_header → Page:Header:Minimal   (inline, no ESI)
│    ├─ Page:Logo
│    ├─ header.supportInfo
│    └─ Button (frontend.home.page)
├─ page_checkout → Checkout:Success        (no data-component)
│    ├─ Cart:Flashes
│    ├─ Checkout:Success:Header
│    │    ├─ h1 (finishHeader / finishUpdateHeader)
│    │    ├─ order number (data-order-number)
│    │    ├─ enhanced conversions (gtag user_data)
│    │    ├─ hidden-line-items-information (cart: page.order)
│    │    ├─ finishPaymentHeader (changedPayment)
│    │    └─ finishInfoConfirmationMail teaser (not changedPayment)
│    ├─ Checkout:Success:Addresses → Address:List
│    │    ├─ shipping card (unless hideShippingAddress)
│    │    └─ billing card (or checkout.addressEqualText)
│    ├─ Checkout:Success:Payment
│    ├─ Checkout:Success:Shipping          (if order delivery + shipping method)
│    ├─ Cart:Items grid, nestedLineItems, showRemoveButton=false, showQuantitySelect=false
│    ├─ additional
│    │    ├─ Checkout:Success:Comment      (if order.customerComment)
│    │    └─ Checkout:Success:DeliveryDate (if custom field set)
│    └─ Checkout:Success:Aside
│         └─ Cart:Summary (page.order)
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): main + sticky aside (`--vi-checkout-success-cols`). Aside `top` is `--vi-top` (`24px`). Mobile: stack.

## Scripts

No owner JS. `Checkout:Success` has **no** `data-component`. `Cart:Items` / `Cart:Heading` island hooks are unused here (no `Cart:Page` swap).

`Checkout:Method` on this page is display-only (`interactive=false`). Do **not** mount `Checkout:Method:Form`.

## Checkout:Success:Addresses

Class component. Derives addresses from `page.order` in `#[PostMount]`. Template is a root-host of [`Address:List`](address.md) (equal-id copy and card chrome live there). No action nests.

| Prop | Default | Notes |
|------|---------|--------|
| `page` | required | `CheckoutFinishPage` |
| `billingAddress` | `order.billingAddress` | |
| `shippingAddress` | delivery shipping address, or billing when ids match | |
| `hideShippingAddress` | no 6.7 delivery / no 6.8 `primaryOrderDelivery` | |

| Shopware | Shipping source |
|----------|-----------------|
| 6.7 | `order.deliveries.first` |
| 6.8 (`v6.8.0.0`) | `order.primaryOrderDelivery` |

## Checkout:Success:Payment / :Shipping

Class VMs. One method row each — not the confirm radio lists (`page.paymentMethods` is absent on finish).

| Shopware | Payment | Shipping |
|----------|---------|----------|
| 6.7 | `order.transactions.last.paymentMethod` | `order.deliveries.first.shippingMethod` |
| 6.8 | `order.primaryOrderTransaction.paymentMethod` | `order.primaryOrderDelivery.shippingMethod` |

`CheckoutFinishPageSubscriber` on `CheckoutFinishPageOrderCriteriaEvent` adds `*.paymentMethod.media` / `*.shippingMethod.media` (core finish criteria omit media) and `orderCustomer` (enhanced conversions).

Shipping renders nothing when `visible` is false (no delivery / no method).

`Checkout:Method` props: `interactive=false`, `selectedMethodId` = `methodId`, description truncated at 75 chars (same as confirm).

## Cart:Items on the order

Optional `lineItems` (default `cart.lineItems`) so finish can pass `page.order.nestedLineItems` without flattening children. `cart` is still `page.order` for `deliveries` / empty checks.

Qty / remove stay off — order line items are not cart `LineItem` mutators.

## Checkout:Success:Header

| State | Copy |
|-------|------|
| Default | `checkout.finishHeader` (`%shop%` = `core.basicInformation.shopName`) + confirmation-mail teaser |
| `page.changedPayment` | `checkout.finishUpdateHeader` + `checkout.finishPaymentHeader` (`%paymentName%`) — no teaser |

Order number uses `checkout.finishInfoOrdernumber` + `page.order.orderNumber`. Hidden GA dump is the core include with `cart: page.order`.

`paymentFailed` never reaches this template — core redirects to edit-order.

## Out of scope

- Account edit-order redesign (isolation stub only)
- PayPal PUI (`finish-details` block overrides do not apply once `page_checkout` is replaced)
- `paymentFailed` UI (core redirect)
- Qty / remove / `Cart:Changed` / `/vi/finish`
- New snippets (reuse `checkout.finish*` + `checkout.preferredDeliveryDateHeader`)

## Files

`components/Checkout/Success.*` · `components/Checkout/Success/{Header,Addresses,Payment,Shipping,Comment,DeliveryDate,Aside}.*` · `components/Order/Addresses.*` · `storefront/page/checkout/finish/index.html.twig` · `src/Subscriber/CheckoutFinishPageSubscriber.php`

## Related

- [Address](address.md)
- [Account pages](account.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout register](checkout-register.md)
- [Cart page](cart-page.md)
- [Preferred delivery date](delivery-date.md)
- [Footer](footer.md)
- [JavaScript](../conventions/javascript.md)
