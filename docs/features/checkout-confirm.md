# Checkout confirm

Theme-owned `/checkout/confirm` (`frontend.checkout.confirm.page`). Guest and empty-cart redirects stay in core `CheckoutController`.

Unlike [cart page](cart-page.md), **`Checkout:Confirm` has no `data-component` / no island JS**. Address change is nested `Address:Manager:Action` ([address manager](address-manager.md)). Line items are a read-only `LineItems:Table` — qty stepper / remove stay on the cart page. Confirm does not use `Cart:Heading`.

Does **not** own account edit-order / complete-payment. That page is [`Account:Order:Edit`](account.md) on checkout `_page.html.twig` (not `Checkout:Confirm`).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/confirm/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Confirm` |
| `Page:Header:Minimal` | Inline header (no ESI). Full-bleed bar; inner `.container` owns the grid (`Page:Logo`, `Page:Support`, light `Button`). Column gap is `column-gap-6` (24px); row gap is `row-gap-2` (8px). No min-height and no inline padding. `supportDisplay` defaults to `all`; `desktop` hides `Page:Support` below `xl`. Confirm passes `supportDisplay="desktop"`. `action` defaults to `home` (`frontend.home.page`, `checkout.finishButtonBackToShop`). Confirm passes `action="cart"` (`frontend.checkout.cart.page`, `checkout.backToCart`) |
| `Checkout:Confirm` | Layout composer — flashes, violations, `Checkout:Confirm:Title`, then `Checkout:Confirm:Main` and `Checkout:Aside`. No page JS. Does not mount `Cart:Heading` |
| `Checkout:Confirm:Title` | Class view-model. `#[PostMount]` builds `heading` and keyed `meta` (`email`, `items`, `arrival`) from the cart and customer. Fills `Checkout:Title`’s `description` block with `Page:Support` (`d-xl-none`). Passes Confirm’s grid class through. No `g-col-*` in its CVA |
| `Checkout:Confirm:Main` | Primary column (`div`). Confirm passes `g-col-1 g-col-xl-5 g-col-xxl-8`. Addresses, methods, and items. Section gap 28px, 40px from `xl`. No `data-component`. No `g-col-*` in its CVA |
| `Checkout:Title` | Shared class view-model. `heading` string and `meta` as `array<string, CheckoutTitleMeta>` (`label`, optional `icon`). Each entry renders in `{% block meta_item %}` (`key` and `item` in scope). The meta container and the items wrapper are `div`s. The `description` block is empty. No `g-col-*` in its CVA |
| `Checkout:Aside` | Sidebar column (`<aside>`). Confirm gives it `g-col-1 g-col-xl-3`. Below `xl` it stacks after main. Mounts `Checkout:Additions` then `Checkout:Summary` |
| `Checkout:Summary` | Sticky summary card: `Cart:Summary` with confirm row CVA, `Checkout:ArrivalDate`, TOS, place-order, secure note. Not `Cart:Page:Aside` / `Register:Aside` |
| `Checkout:ArrivalDate` | Delivery-period pill. First cart delivery’s `deliveryDate`, `checkout.lineItemDeliveryDate`, truck icon. Hidden when `ViewsTheme.config.checkoutArrivalDateActive` is off, or when the cart has no delivery date. Not the title meta line |
| `Checkout:Addresses` | Section + address panel. Class view-model builds the cards; Twig owns the section, the `checkout.confirmAddresses` title, the columns, `Address`, and `Address:Manager:Action`. Not [`Address:List`](address.md) |
| `Checkout:Methods` | Section + one shared card around payment and shipping. Title `checkout.confirmMethods` |
| `Payment:Selection` / `Shipping:Selection` | Columns inside that card: icon + label, then `Form:Selection` radios inside `Checkout:Method:Form`. Shipping is a class view-model and renders only for a physical line item. Payment `framed` defaults to true for edit-order |
| `Checkout:Method:Form` | POST `frontend.checkout.configure`; native change → submit |
| `Checkout:Confirm:Tos` | Required `tos` (+ `revocation` when `page.showRevocation`). Modal links like `Privacy:Note` |
| `Checkout:Additions` | Pen “Before you order” box around comment and delivery date. Card chrome lives here |
| `Checkout:Confirm:Comment` | Inside Additions. `Form:Textarea` + comment-only localStorage persist |
| `Checkout:DeliveryDateSelection` | Inside Additions, next to the comment. Subscribers unchanged ([delivery-date](delivery-date.md)) |
| `Form:Handler` | `#confirmOrderForm` owner — hash + submit (`frontend.checkout.finish.order`) |
| Footer | [`Page:Footer:Minimal`](footer.md) via `base_esi_footer` (inline, no ESI) |

Do **not** add `storefront/layout/header/header-minimal.html.twig` or `storefront/layout/footer/footer-minimal.html.twig`. Success also uses `Page:Header:Minimal` — [checkout-success](checkout-success.md). Footer: [footer](footer.md).

## Composition

```
page/checkout/confirm/index.html.twig
├─ base_esi_header → Page:Header:Minimal supportDisplay="desktop" action="cart"   (inline, no ESI)
│    └─ .container
│         ├─ Page:Logo
│         ├─ Page:Support                  (hidden below xl on confirm)
│         └─ Button (frontend.checkout.cart.page, checkout.backToCart)
├─ page_checkout → Checkout:Confirm        (.grid; grid-columns-1, grid-columns-xl-8; no data-component)
│    ├─ Cart:Flashes                       (g-col-1 g-col-xl-8)
│    ├─ formViolations → Alert             (g-col-1 g-col-xl-8)
│    ├─ Checkout:Confirm:Title            (caller class: g-col-1 g-col-xl-8 g-col-xxl-12)
│    │    └─ Checkout:Title
│    │         ├─ h1 heading prop          (checkout.confirmHeader)
│    │         ├─ description block        (Confirm:Title: Page:Support d-xl-none)
│    │         └─ meta                     (keyed CheckoutTitleMeta: email · items · arrival; block meta_item)
│    ├─ Checkout:Confirm:Main             (div; caller class: g-col-1 g-col-xl-5 g-col-xxl-8)
│    │    ├─ Checkout:Addresses
│    │    │    ├─ h2 checkout.confirmAddresses
│    │    │    └─ shipping / billing columns → Address (equal copy overrides content; change is Address:Manager:Action)
│    │    ├─ Checkout:Methods
│    │    │    ├─ h2 checkout.confirmMethods
│    │    │    ├─ Payment:Selection                  (framed=false)
│    │    │    └─ Shipping:Selection                 (class VM; if physical line item)
│    │    └─ checkout.confirmItems
│    │         ├─ LineItems:Table   (cart=page.cart, showRemoveButton=false, showQuantitySelect=false)
│    │         └─ checkout.confirmReturns
│    └─ Checkout:Aside                 (<aside>; g-col-1 g-col-xl-3)
│         ├─ Checkout:Additions
│         │    ├─ Checkout:Confirm:Comment           (if core.cart.showCustomerComment)
│         │    └─ Checkout:DeliveryDateSelection
│         └─ Checkout:Summary
│              ├─ Cart:Summary                       (confirm row CVA; `grand_total` override adds `Divider`)
│              ├─ Checkout:ArrivalDate             (first delivery deliveryDate; omit if none or switch off)
│              ├─ Checkout:Confirm:Tos               (tos + revocation)
│              ├─ Form:Handler#confirmOrderForm → hash + Button submit (`blockResubmit`)
│              └─ secure note                       (`checkout.confirmSecureNote`)
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): eight equal tracks (`grid-columns-xl-8`). Flashes, violations, and the title span the row (`g-col-xl-8`). `Checkout:Confirm:Main` is `g-col-xl-5` (`g-col-xxl-8` from `xxl`) and `Checkout:Aside` is `g-col-xl-3` (`g-col-xxl-4` from `xxl`). Column gap is 64px (`column-gap-xl-9`). Row gap is 32px (`row-gap-7`). Inside the xl container that aside is about 399px; from `xxl` the container grows and the aside grows with it. Inside Main the section gap is 28px, 40px from `xl`. Root padding is 40px / 64px. The summary card stays `position-xl-sticky`; `top` is `--vi-top` (`24px`).

Mobile: one track (`grid-columns-1`), so every direct child is `g-col-1`. The title, `Checkout:Confirm:Main`, and `Checkout:Aside` stack with a 32px row gap (top padding 24px). Inside the main column, addresses, payment and delivery, and items stack with a 28px gap. `Checkout:Aside` follows as the closing stack: `Additions` then `Summary` (gap 16px, padding 20px / 28px). The horizontal inset stays the storefront `.container`, shared with the minimal header.

`Cart:Items` stays the stacked list for the cart drawer and the register aside. Comment localStorage and the delivery-date subscriber stay on those components; `Additions` is the chrome around them. Confirm does not mount `Comment` or `DeliveryDateSelection` itself.

TOS lives **in the summary** with submit (not top of main). Associated fields (`tos`, `revocation`, `customerComment`, `viewsThemeDeliveryDate`) use `form="confirmOrderForm"`.

## Checkout:Confirm:Title

`Checkout:Confirm` mounts `<twig:ViewsTheme:Checkout:Confirm:Title>` and passes `page`. The component is class-backed. `#[PostMount]` builds `heading` (`checkout.confirmHeader`) and `meta` as `array<string, CheckoutTitleMeta>`. The template does not calculate those values. The grid span is Confirm’s `title` class (`g-col-1 g-col-xl-8 g-col-xxl-12`), passed through onto `Checkout:Title`. `Checkout:Confirm:Title` has no element of its own and no `g-col-*` in its CVA.

`meta` keys: `email` (customer email via `EmailIdnConverter::decode`, omitted when empty), `items` (`checkout.itemCounter` with the cart line-item count), and `arrival` (`checkout.confirmArrival`, omitted when the cart has no delivery). Each entry is a label with no icon. The support line is `Page:Support` (`d-xl-none`), so that line shows only below `xl`.

Arrival uses the first cart delivery’s `deliveryDate.earliest` / `latest` — the dates Shopware already stores on the delivery, not the preferred-delivery-date field. Same month renders as a day plus the later day and month (`checkout.confirmArrival`, pen shape “Arrives 16–20 October”). The arrival segment is omitted when the cart has no delivery.

## Checkout:Title

`Checkout:Confirm:Title` mounts `<twig:ViewsTheme:Checkout:Title>` with a `heading` string and `meta`. It does not pass `page`. `Checkout:Title` is class-backed. `#[PostMount]` maps each hash to `CheckoutTitleMeta` (`label`, optional `icon` for `vi_icon`), keeps the caller key, and drops an empty label.

`checkout.confirmHeader` is the h1 (30px, 600; from `xl` 36px, 600, letter-spacing `-0.7px`). The meta container is a `div`. An inner `div` holds the items. `{% block meta_item %}` renders once per entry with `key` and `item` in scope, so a caller can override that block and branch on `key`. A middot sits between items, outside the block. Title omits the line when nothing remains. An `icon` renders with `vi_icon` before its label. Meta type is 14px below `xl` and 16px from `xl`.

The `description` block on `Checkout:Title` is empty. `Checkout:Confirm:Title` fills it with `Page:Support` (`d-xl-none`). Confirm also passes `supportDisplay="desktop"` on the minimal header so that header’s `Page:Support` hides below `xl`. Register, success, and edit-order do not pass it, so their header keeps `Page:Support` at every width.

Section titles (`checkout.confirmAddresses` on `Checkout:Addresses`, `checkout.confirmItems` on `Checkout:Confirm:Main`, and `checkout.confirmMethods` on `Checkout:Methods`) are 20px / 600. The returns note (`checkout.confirmReturns`, `arrow-counter-clockwise` at 14px) sits beside `LineItems:Table`, not inside it.

Below `lg`, each confirm row is the stacked line item inside `LineItems:Table`: 80px cover (`rounded-2`), name, delivery window, then `Product:Variations` badges, then the quantity (“Quantity” plus the amount) and the line total. From `lg` that row is the Product / Qty / Price column grid and the quantity is the amount only. Arrival stays on the title and on `Checkout:ArrivalDate`.

## Checkout:Confirm:Main

Primary column. Root is a `div`; the page landmark stays `#content-main`. `Checkout:Confirm` mounts `<twig:ViewsTheme:Checkout:Confirm:Main>` and passes `page`, with `g-col-1 g-col-xl-5 g-col-xxl-8` on that tag. No `g-col-*` in its CVA. No `data-component`.

Column layout: flex column, `min-w-0`. Section gap is `--vi-confirm-main-gap` (28px, 40px from `xl`).

Blocks: `addresses` (`Checkout:Addresses`), `methods` (`Checkout:Methods`), `items` (`checkout.confirmItems`, read-only `LineItems:Table`, then `returns`). The returns icon is `--vi-confirm-main-icon` (14px). Returns copy is 13px with line-height 1.4, and 14px / normal from `xl`.

## Checkout:Aside

Sidebar landmark. Root is `<aside>`. `Checkout:Confirm` mounts it and passes `page`, with `g-col-1 g-col-xl-3` on that tag. The column layout lives here: flex column, gap 16px (24px from `xl`), padding-top 20px below `xl`, padding-bottom 28px below `xl`.

Blocks: `additions` (`Checkout:Additions`), `summary` (`Checkout:Summary`). Sticky stays on the summary card.

## Checkout:Summary

Summary card for confirm only. Root is a `div`; the landmark is `Checkout:Aside`. Chrome (coral accent, linen border, 12px radius, 24px padding (`p-6`)) is on this card. Row utilities are plain class strings on the `Cart:Summary` call: `total:cva`, `shipping:cva`, `grand:cva`, `net:cva`, and `tax:cva` (`root`, `label`, `value`). `cva.root` is the summary grid (`d-grid align-items-center`). Subtotal and shipping are `fs-5`, labels `fw-medium text-muted`, values `fw-semibold`. The grand total is `fs-5` / `fw-semibold`, and its value is `vi-cart-summary__grand fs-3 fw-bold`. Net and tax are `fs-6 text-muted` at `fw-normal`. `.vi-checkout-summary` assigns `--vi-cart-summary-gap` (`10px`) and `--vi-cart-summary-tracking` (`-0.6px`). Confirm overrides `grand_total` and renders `Divider` (`my-2`) before `GrandTotal`. The span is `--vi-divider-col` (`1 / -1`) on `.vi-divider`. `GrandTotal` is only the row. The cart page does not override that block, so it has no rule, and it keeps each row component’s default classes. The card stays `position-xl-sticky`; `top` is `--vi-top` (`24px`).

Arrival is `Checkout:ArrivalDate`: the first cart delivery’s `deliveryDate.earliest` / `latest`, rendered with `checkout.lineItemDeliveryDate`. Row padding is `py-2 px-3`. The component renders nothing when `ViewsTheme.config.checkoutArrivalDateActive` is off, or when the cart has no delivery. This is not the preferred-delivery-date field and not the title’s `checkout.confirmArrival` line. That title meta string is not gated by this switch.

Place order stays `Form:Handler` `#confirmOrderForm` (`frontend.checkout.finish.order`), the cart hash, and `disabled` when `page.cart.errors.blockResubmit`.

Secure note: `checkout.confirmSecureNote` (`text-muted`). The lock is `icon-size-2`.

## Scripts (theme-owned — no core form plugins)

| Core (forbidden) | Theme owner |
|------------------|-------------|
| `FormHandler` / `data-form-handler` / `data-form-submit-loader` | `Form:Handler` on `#confirmOrderForm` |
| `FormAutoSubmit` / `data-form-auto-submit` | `Checkout:Method:Form` — radio `change` → `requestSubmit()` |
| `FormPreserver` / `CheckoutCustomerStorage` | `Checkout:Confirm:Comment` only — localStorage keyed by customer id. **Never** persist `tos` / `revocation` |
| `FormAddHistory` / `data-form-add-history` | Drop |
| `AddressManager` / `data-address-manager` | `Address:Manager:Action` — [address manager](address-manager.md) |

`Checkout:Confirm` itself has **no** `data-component`. `Form:Handler` includes associated fields (`form="…"`) in constraint-validation chrome.

## Checkout:Addresses

`Checkout:Addresses` owns the section. The title is `checkout.confirmAddresses` (20px / 600). The gap under it is 12px. Under the title is one panel for shipping and billing (`Checkout/Addresses/Desktop`, `Checkout/Addresses/Mobile`). Does **not** compose [`Address:List`](address.md). Account, address book, and success keep `Address:List`.

Class view-model (`Addresses.php`). `#[PostMount]` resolves the defaults below and builds `cards` (shipping, then billing). The template composes the section, the title, CVA, attributes, the warning, `Address`, and `Address:Manager:Action`.

Desktop (`xl` / 1260px): equal columns, billing’s divider on the left. Below `xl`: stacked, change in the column head, billing’s divider on top. Shipping is omitted when `hideShippingAddress`; the divider goes with it.

| Prop | Default | Notes |
|------|---------|--------|
| `page` | required | |
| `billingAddress` | customer `activeBillingAddress` | |
| `shippingAddress` | customer `activeShippingAddress` | |
| `hideShippingAddress` | `CheckoutConfirmPage::isHideShippingAddress()` | Digital-only |
| `addressesEqual` | billing id === shipping id | |
| `showShippingWarning` | `true` | Shipping column only (`address.countryNoShippingAlert`) |
| `shippingTitle` / `billingTitle` | `viewsTheme.checkout.confirmShippingTitle` / `confirmBillingTitle` | |
| `equalTitle` / `equalText` | `viewsTheme.checkout.confirmAddressEqualTitle` / `confirmAddressEqualText` | Same as delivery; invoices go to the delivery address. Not `checkout.addressEqualText` |
| `changeLabel` | `viewsTheme.checkout.confirmAddressChange` | Visible label |

When the ids match and shipping is visible, billing shows `equalTitle` and `equalText` inside `Address`’s `content` block. Shipping still shows the address.

Each other column mounts [`Address`](address.md) with that card’s customer address. `fullName` uses the pen name style and already includes the salutation. Every other field uses the ash body style. Empty fields stay hidden. Zip and city are separate lines. The equal column passes no address.

Change stays `Address:Manager:Action` (`tab` shipping/billing, `hideShipping` from `hideShippingAddress`). Fallback `href` is `frontend.account.address.edit.page`. Visible label is `changeLabel`. `title` and `aria-label` stay `account.overviewChangeShipping` / `overviewChangeBilling`. See [address manager](address-manager.md).

Nests: `title`, `panel`, `shipping`, `billing`, `shippingChange`, `billingChange`. Shared chrome (`head`, `label`, `lines`, `name`, `line`, `change`) is CVA.

Pen metrics: white card, 12px radius, 1px linen border. Column padding 16px, 24px from `xl`. Column gap 10px, 14px from `xl`. Line gap 2px. Title and name 15px, 16px from `xl`, semibold, ink. Body 14px ash, line-height 1.4 below `xl`. Change is 14px semibold ink with a 1px ink bottom rule.

## Payment and shipping

`Checkout:Methods` owns the section. The title is `checkout.confirmMethods` (20px / 600). The gap under it is 12px, 24px from `xl`. Under the title is one card: white, a 1px linen border, and 12px radius. No `data-component`.

From `xl` the card is a row of equal columns (`flex: 1 1 0`). Below `xl` the columns stack. One linen rule sits on the shipping column: its top edge below `xl`, its left edge from `xl`. That rule runs the full card height from `xl`. Shipping’s top padding is 14px below `xl` and 20px from `xl`; the other sides are 16px below `xl`. Payment padding is 16px, 20px from `xl`. A digital-only cart omits shipping, and payment fills the card.

`Payment:Selection` and `Shipping:Selection` are those columns: a 16px icon plus label in a `<div>`, then [`Form:Selection`](form-input.md#formselection) rows (`type="radio"`). The `<fieldset>` is named with `aria-labelledby` on that div. Payment uses `credit-card`; shipping uses `truck`. The label is 15px / 600, 16px from `xl`. Space between the label and the rows is 8px, 16px from `xl`. Rows are 16px apart. The radio is `Form:Selection`.

Payment `framed` defaults to `true`, which adds the standalone card (white, 1px linen, 12px radius) used on edit-order. Methods passes `framed` false so the shared card owns that chrome.

Description is every method’s plain text (tags stripped), truncated at 75 characters. `Shipping:Selection` builds those rows in `Selection.php`: the quote comes from `page.extensions.viewsTheme.shippingPrices`, and a missing quote on the selected method uses that cart delivery’s `shippingCosts.totalPrice`. `trailing` is set there too. A total of `0` is `viewsTheme.checkout.shippingFree` (`Free` / `Gratis`). Any other amount is formatted with `CurrencyFormatter` for the current currency and language. A missing quote leaves `trailing` empty. The template only passes each row into `Form:Selection`. Payment rows omit `trailing`.

`Checkout:Method` is removed. `Checkout:Method:Form` still wraps the confirm lists and POSTs `frontend.checkout.configure` with hidden `redirectTo` = `frontend.checkout.confirm.page`. Shipping renders only when the cart has a physical line item (`State::IS_PHYSICAL`, same as `Cart:ShippingCalculation`).

`Payment:Selection` accepts `action` (default `frontend.checkout.configure`) and `redirectTo`. Edit-order passes the change-payment-method path and an empty redirect. Edit-order shipping stays read-only [`Checkout:Success:Shipping`](checkout-success.md).

## Checkout:Confirm:Tos

Both controls are `Form:Checkbox`. Do **not** implement 6.8 `showTosCheckbox` auto-confirm copy.

| Prop | Default | Notes |
|------|---------|--------|
| `formId` | `confirmOrderForm` | Forwarded as `input:form` |
| `title` | `checkout.confirmTermsHeader` | Omitted when empty. `Checkout:Summary` passes `title: false` |
| `tosUrl` / `revocationUrl` | CMS pages from `core.basicInformation.*` | |
| `formViolations` | ambient | Paths `/tos`, `/revocation` |
| `page` | ambient | `page.showRevocation` gates the revocation checkbox |

Snippets: `checkout.confirmTermsHeader`, `checkout.confirmTermsTextModal`, `checkout.confirmRevocationNoticeModal`. Modal tags match `Privacy:Note` (`<a data-ajax-modal>`).

## Checkout:Additions

Pen component `Checkout/Before you order`. White card, 1px linen border, 12px radius, 20px padding, 16px gap between the title and the fields and between the fields. Title snippet `checkout.beforeYouOrderHeader` (20px / 600, ink). That box title is the only headline.

Wraps `Checkout:Confirm:Comment` and `Checkout:DeliveryDateSelection`. That card chrome stays on this box. Comment localStorage and the delivery-date subscriber stay on those components. The comment has no inner title. Additions passes an empty `title` into the delivery-date picker. The picker is `Form:Input`.

`Checkout:Aside` passes `page` in (self-closing `component()` does not inherit it). Additions passes `page.extensions.viewsTheme.deliveryDate` into `Checkout:DeliveryDateSelection` as `deliveryDate`.

Renders nothing when the customer comment is disabled and the delivery-date extension is inactive. No `data-component`.

`Checkout:Aside` mounts this tag above the summary. On mobile it sits in that column.

| Prop | Default | Notes |
|------|---------|--------|
| `page` | `__context.page` | Aside passes it. Gates the box with the comment config and feeds the delivery-date picker |
| `showComment` | `core.cart.showCustomerComment` | |

## Checkout:Confirm:Comment

Shown when `core.cart.showCustomerComment`. `Form:Textarea` name/id = `OrderService::CUSTOMER_COMMENT_KEY`. No field headline; the textarea label (`checkout.customerCommentLabel`) is the caption. `checkout.customerCommentHeader` stays on the success and order views.

| Hook | Attribute |
|------|-----------|
| Root | `data-component="ViewsTheme:Checkout:Confirm:Comment"` |
| Options | `customerId`, `fieldName` |

Storage key: `views-theme:checkout:comment:{customerId}`. Restore on init; save on input; remove key when empty.

## Edit-order isolation

`frontend.account.edit-order.page` must **not** mount `Checkout:Confirm` or `Checkout:Success`. Theme `storefront/page/account/order/index.html.twig` extends checkout `_page.html.twig` and mounts [`Account:Order:Edit`](account.md). Payment change reuses `Payment:Selection` with the edit-order action; shipping is read-only `Checkout:Success:Shipping`.

## Files

`components/Checkout/Confirm.*` · `components/Checkout/Confirm/{Main,Title,Tos,Comment}.*` · `components/Checkout/{Addresses,Aside,Summary,Additions,Title}.*` · `src/Struct/CheckoutTitleMeta.php` · `components/Checkout/Methods.*` · `components/Payment/Selection.*` · `components/Shipping/Selection.*` · `components/Checkout/Method/Form.*` · `storefront/page/checkout/confirm/index.html.twig` · `storefront/page/account/order/index.html.twig`

## Out of scope

- Addressbook listing / account overview — [account pages](account.md)
- Qty / remove / `Cart:Changed` / `/vi/confirm`
- PayPal `page_checkout_confirm_form_submit`
- 6.8 auto-confirm TOS
- Persist TOS / revocation

## Related

- [Address](address.md)
- [Address manager](address-manager.md)
- [Checkout register](checkout-register.md)
- [Checkout success](checkout-success.md)
- [Cart page](cart-page.md)
- [Preferred delivery date](delivery-date.md)
- [Form input](form-input.md)
- [Footer](footer.md)
- [JavaScript](../conventions/javascript.md)
