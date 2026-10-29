# Checkout success

Theme-owned `/checkout/finish` (`frontend.checkout.finish.page`). Guest login, `paymentFailed` → edit-order, and guest logout stay in core `CheckoutController`.

UX tags are **`Checkout:Success:Page`** (the composer) and `Checkout:Success:*` for the read-only pieces. Shopware’s route and storefront path stay `checkout/finish`.

The page is the read-only twin of [checkout confirm](checkout-confirm.md): same grid, same section titles, same card chrome, and the same shared sub-components, fed by the order DTO (`page.order`) instead of the cart. Unlike [cart page](cart-page.md), **`Checkout:Success:Page` has no `data-component` / no island JS / no `/vi/…`**.

Does **not** own account edit-order / complete-payment. That page is [`Account:Order:Edit`](account.md) — see [checkout confirm](checkout-confirm.md#edit-order-isolation).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/finish/index.html.twig` → `base_esi_header` = `Page:Header:Minimal supportDisplay="desktop"`; `page_checkout` = `Checkout:Success:Page` |
| `Page:Header:Minimal` | Inline header (no ESI), same as confirm: `supportDisplay="desktop"` hides `Page:Support` below `xl` (the title shows it there). `action` stays the default `home` (`frontend.home.page`, `checkout.finishButtonBackToShop`) — the order is placed, so there is no cart to go back to |
| `Checkout:Success:Page` | Layout composer. `.grid`, 8 tracks from `xl` (12 from `xxl`), like Confirm. Flashes, the tracking blocks, `Success:Header`, `Success:Main`, `Success:Aside`. No `g-col-*` in the children’s own CVA — the page passes them in |
| `Checkout:Success:Header` | Class view-model. `#[PostMount]` builds `heading`, `description` and keyed `meta` (`orderNumber`, `email`). Mounts the shared [`Page:Title`](checkout-confirm.md#pagetitle) and fills its `description` block with the intro copy plus `Page:Support` (`d-xl-none`) |
| `Checkout:Success:Main` | Primary column (`div`; page passes `g-col-1 g-col-xl-5 g-col-xxl-8`). Addresses, methods, items. Gap is CVA: `gap-7` (32px), `gap-xl-8` (40px) |
| `Checkout:Success:Addresses` | Class view-model that extends `Order:Addresses` (order billing / delivery shipping, 6.7 vs 6.8). Renders the read-only [`Checkout:Addresses`](address.md) panel |
| `Checkout:Methods` | The confirm card. Success overrides its `payment` and `shipping` blocks |
| `Checkout:Success:Payment` / `:Shipping` | Class VMs. One checked, nameless `Form:Selection`. `framed` false inside `Checkout:Methods`; default `true` (edit-order uses `Success:Shipping` standalone). Shipping omitted when the order has no delivery |
| `LineItems:Table` | Read-only, `lineItems` = `page.order.nestedLineItems`, `cart` = `page.order`, no remove / quantity select |
| `Checkout:Success:Aside` | `<aside>` (page passes `g-col-1 g-col-xl-3 g-col-xxl-4`). Mounts `Checkout:Additions`, then a `Summary:Box` with `Cart:Summary` for `page.order` |
| `Checkout:Additions` | Same card chrome as confirm, with `visible` driven by the order and its `title` / `comment` / `delivery_date` blocks overridden |
| `Checkout:Success:Comment` | Read-only `page.order.customerComment` (no localStorage, no textarea) |
| `Checkout:Success:DeliveryDate` | Read-only preferred date from the order custom field ([delivery-date](delivery-date.md)) |
| Footer | [`Page:Footer:Minimal`](footer.md) via `base_esi_footer` (inline, no ESI) |

Do **not** add `storefront/layout/header/header-minimal.html.twig` or `storefront/layout/footer/footer-minimal.html.twig`. Footer: [footer](footer.md).

## Composition

```
page/checkout/finish/index.html.twig
├─ base_esi_header → Page:Header:Minimal supportDisplay="desktop"   (inline, no ESI; action defaults to home)
├─ page_checkout → Checkout:Success:Page   (.grid; grid-columns-1, grid-columns-xl-8; no data-component)
│    ├─ Cart:Flashes                         (g-col-1 g-col-xl-8 g-col-xxl-12)
│    ├─ Checkout:Success:Header              (caller class: g-col-1 g-col-xl-8 g-col-xxl-12)
│    │    └─ Page:Title
│    │         ├─ h1 heading                  (finishHeader / finishUpdateHeader)
│    │         ├─ description block           (intro paragraph, Page:Support d-xl-none)
│    │         └─ meta                        (orderNumber · email)
│    ├─ Checkout:Success:Main                (div; g-col-1 g-col-xl-5 g-col-xxl-8)
│    │    ├─ Checkout:Success:Addresses → Checkout:Addresses (readOnly)
│    │    │    ├─ h2 checkout.confirmAddresses
│    │    │    └─ shipping (unless hideShippingAddress) / billing columns → Address
│    │    ├─ Checkout:Methods                (payment / shipping blocks overridden)
│    │    │    ├─ h2 checkout.confirmMethods
│    │    │    ├─ Checkout:Success:Payment   (framed=false)
│    │    │    └─ Checkout:Success:Shipping  (framed=false; if order delivery + shipping method)
│    │    └─ checkout.confirmItems
│    │         └─ LineItems:Table (page.order, nestedLineItems, showRemoveButton=false, showQuantitySelect=false)
│    └─ Checkout:Success:Aside               (<aside>; g-col-1 g-col-xl-3 g-col-xxl-4)
│         ├─ Checkout:Additions              (visible when the order has a comment or preferred date; title block empty)
│         │    ├─ Checkout:Success:Comment       (comment block)
│         │    └─ Checkout:Success:DeliveryDate  (delivery_date block)
│         └─ Summary:Box                     (position-xl-sticky; top --vi-top 24px)
│              ├─ h2 checkout.summaryHeader
│              └─ Cart:Summary (summary: page.order)
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): eight equal tracks, column gap 64px, row gap 32px. Flashes and the title span the row. Main is `g-col-xl-5` (`g-col-xxl-8`), aside `g-col-xl-3` (`g-col-xxl-4`). Mobile: one track; title, main and aside stack with a 32px row gap, aside after main (`pt-5`).

## Scripts

No owner JS. `Checkout:Success:Page` has **no** `data-component`. There is no `Cart:Page` swap, so the `LineItems:Table` / `Cart:Heading` island hooks are unused here.

`Checkout:Success:Payment` and `Checkout:Success:Shipping` are display recaps: one checked `Form:Selection` with no `name`. Do **not** mount `Checkout:Method:Form`.

## Checkout:Success:Header

Class view-model, same shape as `Checkout:Confirm:Title`. `#[PostMount]` needs a `CheckoutFinishPage`; otherwise nothing is built.

| State | `heading` | `description` |
|-------|-----------|---------------|
| Default | `checkout.finishHeader` (`%shop%` = `core.basicInformation.shopName` for the order’s sales channel) | `checkout.finishInfoConfirmationMail` |
| `page.changedPayment` | `checkout.finishUpdateHeader` | `checkout.finishPaymentHeader` (`%paymentName%`) |

`meta` keys: `orderNumber` (`checkout.finishInfoOrdernumber` + `page.order.orderNumber`) and `email` (order customer email via `EmailIdnConverter::decode`, omitted when empty). `data-order-number` is set on the `Page:Title` root. The description paragraph is `fs-6` (`fs-xl-5`) and is sanitized (`sw_sanitize`).

The Google enhanced-conversions `gtag` script and the hidden GA line-item dump are not rendered.

`paymentFailed` never reaches this template — core redirects to edit-order.

## Checkout:Success:Addresses

Class component that **extends** `Order:Addresses`, so `#[PostMount]` is inherited: it derives billing, shipping and `hideShippingAddress` from `page.order`. The template is a root host of [`Checkout:Addresses`](address.md) with `readOnly: true` (no `Address:Manager:Action`, no context fallback, no shipping warning).

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

When the ids match and shipping is visible, billing shows the equal copy (`viewsTheme.checkout.confirmAddressEqualTitle` / `Text`), as on confirm.

## Checkout:Success:Payment / :Shipping

Class VMs. One method row each — not the confirm radio lists (`page.paymentMethods` is absent on finish).

| Shopware | Payment | Shipping |
|----------|---------|----------|
| 6.7 | `order.transactions.last.paymentMethod` | `order.deliveries.first.shippingMethod` |
| 6.8 | `order.primaryOrderTransaction.paymentMethod` | `order.primaryOrderDelivery.shippingMethod` |

`CheckoutFinishPageSubscriber` on `CheckoutFinishPageOrderCriteriaEvent` adds `*.paymentMethod.media` / `*.shippingMethod.media` (core finish criteria omit media) and `orderCustomer` (header email meta).

Shipping renders nothing when `visible` is false (no delivery / no method).

Both mirror `Payment:Selection`: a `<section>` named by its title `<div>` (`aria-labelledby`), a `framed` CVA variant (`true` → white card, 1px border, `rounded-4`), and a semibold label. `Checkout:Success:Main` passes `framed` false so the shared `Checkout:Methods` card owns the chrome. Edit-order keeps the default (`Account:Order:Edit` mounts `Success:Shipping` standalone).

Rows are `Form:Selection` (`type="radio"`, `checked`, no `name`). Description is plain text truncated at 75 characters (same as confirm). Shipping passes `trailing` from that delivery’s `shippingCosts.totalPrice` (order currency when loaded). Payment omits `trailing`.

## Line items on the order

`LineItems:Table` `lineItems` (default `cart.lineItems`) so finish can pass `page.order.nestedLineItems` without flattening children. `cart` is still `page.order` for `deliveries` / empty checks.

Qty / remove stay off — order line items are not cart `LineItem` mutators. Success has no returns note (confirm’s mentions cart quantity changes).

## Checkout:Success:Aside

Props: `page`, `comment` (`page.order.customerComment`), `customFieldKey` (`ViewsTheme.config.deliveryDateCustomFieldKey`, default `preferred_delivery_date`) and `date` (that order custom field). Nests: `additions`, `orderComment`, `orderDeliveryDate`, `box`, `heading`, `summary`. The outer Twig block for the card is named `box`, not `summary`, so it cannot collide with the inner `{% vi_block summary %}`.

`Checkout:Additions` is mounted with `visible` = comment or date, an empty `title` block, and `comment` / `delivery_date` blocks that mount `Success:Comment` / `Success:DeliveryDate`. Those two print their own label (`checkout.customerCommentHeader`, `checkout.preferredDeliveryDateHeader`, 14px / 600) and value. The summary card is the confirm look without arrival, TOS and place-order. The card is `position-xl-sticky`; `top` is `--vi-top` (`24px`, `Aside.css`).

## Out of scope

- Account edit-order redesign (isolation stub only)
- PayPal PUI (`finish-details` block overrides do not apply once `page_checkout` is replaced)
- `paymentFailed` UI (core redirect)
- Qty / remove / `Cart:Changed` / `/vi/finish`
- New snippets (reuse `checkout.finish*`, `checkout.confirm*`, `checkout.customerCommentHeader`, `checkout.preferredDeliveryDateHeader`)

## Files

`components/Checkout/Success/{Page,Header,Main,Addresses,Payment,Shipping,Comment,DeliveryDate,Aside}.*` · `components/Order/Addresses.*` (parent of `Success:Addresses`) · `components/Checkout/{Addresses,Methods,Additions,Title}.*` · `storefront/page/checkout/finish/index.html.twig` · `src/Subscriber/CheckoutFinishPageSubscriber.php`

## Related

- [Address](address.md)
- [Account pages](account.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout register](checkout-register.md)
- [Cart page](cart-page.md)
- [Summary box](summary-box.md)
- [Preferred delivery date](delivery-date.md)
- [Footer](footer.md)
- [JavaScript](../conventions/javascript.md)
