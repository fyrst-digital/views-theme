# Checkout confirm

Theme-owned `/checkout/confirm` (`frontend.checkout.confirm.page`). Guest and empty-cart redirects stay in core `CheckoutController`.

Unlike [cart page](cart-page.md), **`Checkout:Confirm` has no `data-component` / no island JS**. Address change is nested `Address:Manager:Action` ([address manager](address-manager.md)). Line items are a read-only `LineItems:Table` — qty stepper / remove stay on the cart page. Confirm does not use `Cart:Heading`.

`Stepper` is not mounted on confirm, cart, register, success, or edit-order. The pen’s Cart / Details / Delivery / Review row is an example only: Shopware has no stepper and no delivery step.

Does **not** own account edit-order / complete-payment. That page is [`Account:Order:Edit`](account.md) on checkout `_page.html.twig` (not `Checkout:Confirm`).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/confirm/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Confirm` |
| `Page:Header:Minimal` | Inline header (no ESI): `Page:Logo`, `header.supportInfo`, light `Button` home (`arrow-left`). `supportDisplay` defaults to `all`; `desktop` hides support below `xl`. Confirm passes `supportDisplay="desktop"` |
| `Checkout:Confirm` | Layout composer — flashes, violations, title, addresses, methods, items, closing stack (`Additions` then `Aside`). No page JS. Does not mount `Stepper` or `Cart:Heading` |
| `Checkout:Confirm:Aside` | Sticky summary card: `Cart:Summary` nested as-is, arrival range, TOS, place-order, secure note. Not `Cart:Page:Aside` / `Register:Aside` |
| `Checkout:Confirm:Addresses` | Confirm address panel. Country address-format lines + `Address:Manager:Action`. Not [`Address:List`](address.md) |
| `Checkout:Methods` | Section + one shared card around payment and shipping. Title `checkout.confirmMethods` |
| `Payment:Selection` / `Shipping:Selection` | Columns inside that card: icon + label, then `Form:Selection` radios inside `Checkout:Method:Form`. Shipping renders only for a physical line item. Payment `framed` defaults to true for edit-order |
| `Checkout:Method:Form` | POST `frontend.checkout.configure`; native change → submit |
| `Checkout:Confirm:Tos` | Required `tos` (+ `revocation` when `page.showRevocation`). Modal links like `Privacy:Note` |
| `Checkout:Confirm:Additions` | Pen “Before you order” box around comment and delivery date. Card chrome lives here |
| `Checkout:Confirm:Comment` | Inside Additions. `Form:Textarea` + comment-only localStorage persist |
| `Checkout:DeliveryDateSelection` | Inside Additions, next to the comment. Subscribers unchanged ([delivery-date](delivery-date.md)) |
| `Form:Handler` | `#confirmOrderForm` owner — hash + submit (`frontend.checkout.finish.order`) |
| Footer | [`Page:Footer:Minimal`](footer.md) via `base_esi_footer` (inline, no ESI) |

Do **not** add `storefront/layout/header/header-minimal.html.twig` or `storefront/layout/footer/footer-minimal.html.twig`. Success also uses `Page:Header:Minimal` — [checkout-success](checkout-success.md). Footer: [footer](footer.md).

## Composition

```
page/checkout/confirm/index.html.twig
├─ base_esi_header → Page:Header:Minimal supportDisplay="desktop"   (inline, no ESI)
│    ├─ Page:Logo
│    ├─ header.supportInfo            (hidden below xl on confirm)
│    └─ Button (frontend.home.page)
├─ page_checkout → Checkout:Confirm        (no data-component, no Stepper)
│    ├─ Cart:Flashes
│    ├─ formViolations → Alert
│    ├─ title
│    │    ├─ h1 checkout.confirmHeader
│    │    ├─ header.supportInfo            (below xl only)
│    │    └─ meta: email · checkout.itemCounter · arrival
│    ├─ main
│    │    ├─ checkout.confirmAddresses + Checkout:Confirm:Addresses
│    │    │    (not Address:List; change is Address:Manager:Action)
│    │    ├─ Checkout:Methods
│    │    │    ├─ h2 checkout.confirmMethods
│    │    │    ├─ Payment:Selection                  (framed=false)
│    │    │    └─ Shipping:Selection                 (if physical line item)
│    │    └─ checkout.confirmItems
│    │         ├─ LineItems:Table   (cart=page.cart, showRemoveButton=false, showQuantitySelect=false)
│    │         └─ checkout.confirmReturns
│    └─ close (aside column from xl, stack after main below xl)
│         ├─ Checkout:Confirm:Additions
│         │    ├─ Checkout:Confirm:Comment           (if core.cart.showCustomerComment)
│         │    └─ Checkout:DeliveryDateSelection
│         └─ Checkout:Confirm:Aside
│              ├─ Cart:Summary                       (as-is; row tweaks scoped on this aside)
│              ├─ arrival range                     (first delivery deliveryDate; omit if none)
│              ├─ Checkout:Confirm:Tos               (tos + revocation)
│              ├─ Form:Handler#confirmOrderForm → hash + Button submit (`blockResubmit`)
│              └─ secure note                       (`checkout.confirmSecureNote`)
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): the title spans the row, then main and a 400px closing column (`--vi-checkout-confirm-aside`, column gap 56px). Title-to-columns gap is 36px. Main section gap is 40px. Root padding is 40px / 64px. The aside stays `position-xl-sticky`; `top` is `--vi-top` (`24px`).

Mobile: title, addresses, payment and delivery, and items stack with a 28px gap (padding 24px / 32px). `Additions` then `Aside` follow as the closing stack (gap 16px, padding 20px / 28px). The horizontal inset stays the storefront container, shared with the minimal header (pen page inset 160px / 16px).

`Stepper` is not mounted. `Cart:Items` stays the stacked list for the cart drawer and the register aside. Comment localStorage and the delivery-date subscriber stay on those components; `Additions` is the chrome around them. Confirm does not mount `Comment` or `DeliveryDateSelection` itself.

TOS lives **in the aside** with submit (not top of main). Associated fields (`tos`, `revocation`, `customerComment`, `viewsThemeDeliveryDate`) use `form="confirmOrderForm"`.

## Title

`checkout.confirmHeader` is the h1 (30px, 600; from `xl` 36px, 600, letter-spacing `-0.7px`). The meta line under it is the customer email, `checkout.itemCounter` with `page.cart.lineItems|length`, and an arrival range. A middot separates the segments. Meta type is 14px below `xl` and 16px from `xl`.

Arrival uses the first cart delivery’s `deliveryDate.earliest` / `latest` — the dates Shopware already stores on the delivery, not the preferred-delivery-date field. Same month renders as a day plus the later day and month (`checkout.confirmArrival`, pen shape “Arrives 16–20 October”). The arrival segment is omitted when the cart has no delivery.

Below `xl`, `header.supportInfo` sits between the heading and the meta. Confirm passes `supportDisplay="desktop"` so the header hides that same snippet under the desktop breakpoint. Register, success, and edit-order do not pass it, so their header keeps support at every width.

Section titles (`checkout.confirmAddresses`, `checkout.confirmItems`, and `checkout.confirmMethods` on `Checkout:Methods`) are 20px / 600. The returns note (`checkout.confirmReturns`, `arrow-counter-clockwise` at 14px) sits beside `LineItems:Table`, not inside it.

## Checkout:Confirm:Aside

Summary card for confirm only. Chrome (coral accent, linen border, 12px radius, 28px padding) is on this aside. `Cart:Summary` is nested as-is. Row size, the divider before the grand total, and muted labels are scoped under `.vi-checkout-confirm-aside` so the cart page summary does not change.

Arrival is the first cart delivery’s `deliveryDate.earliest` / `latest`, rendered with `checkout.lineItemDeliveryDate`. The block is omitted when the cart has no delivery. This is not the preferred-delivery-date field and not the title’s `checkout.confirmArrival` line.

Place order stays `Form:Handler` `#confirmOrderForm` (`frontend.checkout.finish.order`), the cart hash, and `disabled` when `page.cart.errors.blockResubmit`.

Secure note: `checkout.confirmSecureNote`.

## Scripts (theme-owned — no core form plugins)

| Core (forbidden) | Theme owner |
|------------------|-------------|
| `FormHandler` / `data-form-handler` / `data-form-submit-loader` | `Form:Handler` on `#confirmOrderForm` |
| `FormAutoSubmit` / `data-form-auto-submit` | `Checkout:Method:Form` — radio `change` → `requestSubmit()` |
| `FormPreserver` / `CheckoutCustomerStorage` | `Checkout:Confirm:Comment` only — localStorage keyed by customer id. **Never** persist `tos` / `revocation` |
| `FormAddHistory` / `data-form-add-history` | Drop |
| `AddressManager` / `data-address-manager` | `Address:Manager:Action` — [address manager](address-manager.md) |

`Checkout:Confirm` itself has **no** `data-component`. `Form:Handler` includes associated fields (`form="…"`) in constraint-validation chrome.

## Checkout:Confirm:Addresses

One panel for shipping and billing (`Checkout/Addresses/Desktop`, `Checkout/Addresses/Mobile`). Does **not** compose [`Address:List`](address.md). Account, address book, and success keep `Address:List`.

Desktop (`xl` / 1260px): equal columns, billing’s divider on the left. Below `xl`: stacked, change in the column head, billing’s divider on top. Shipping is omitted when `hideShippingAddress`; the divider goes with it.

| Prop | Default | Notes |
|------|---------|--------|
| `page` | required | |
| `billingAddress` | `context.customer.activeBillingAddress` | |
| `shippingAddress` | `context.customer.activeShippingAddress` | |
| `hideShippingAddress` | `page.hideShippingAddress` | Digital-only |
| `addressesEqual` | billing id === shipping id | |
| `showShippingWarning` | `true` | Shipping column only (`address.countryNoShippingAlert`) |
| `shippingTitle` / `billingTitle` | `viewsTheme.checkout.confirmShippingTitle` / `confirmBillingTitle` | |
| `equalTitle` / `equalText` | `viewsTheme.checkout.confirmAddressEqualTitle` / `confirmAddressEqualText` | Same as delivery; invoices go to the delivery address. Not `checkout.addressEqualText` |
| `changeLabel` | `viewsTheme.checkout.confirmAddressChange` | Visible label |

When the ids match and shipping is visible, billing shows `equalTitle` and `equalText`. Shipping still shows the address.

Lines are the country address format (same renderer as [`Address`](address.md)). The first line uses the pen name style; later lines are the ash body. Additional street lines stay separate.

Change stays `Address:Manager:Action` (`tab` shipping/billing, `hideShipping` from `hideShippingAddress`). Fallback `href` is `frontend.account.address.edit.page`. Visible label is `changeLabel`. `title` and `aria-label` stay `account.overviewChangeShipping` / `overviewChangeBilling`. See [address manager](address-manager.md).

Nests: `shipping`, `billing`, `shippingChange`, `billingChange`. Shared chrome (`head`, `label`, `lines`, `name`, `line`, `change`) is CVA.

Pen metrics: white card, 12px radius, 1px linen border. Column padding 16px, 24px from `xl`. Column gap 10px, 14px from `xl`. Line gap 2px. Title and name 15px, 16px from `xl`, semibold, ink. Body 14px ash, line-height 1.4 below `xl`. Change is 14px semibold ink with a 1px ink bottom rule.

## Payment and shipping

`Checkout:Methods` owns the section. The title is `checkout.confirmMethods` (20px / 600). The gap under it is 12px, 24px from `xl`. Under the title is one card: white, a 1px linen border, and 12px radius. No `data-component`.

From `xl` the card is a row of equal columns (`flex: 1 1 0`). Below `xl` the columns stack. One linen rule sits on the shipping column: its top edge below `xl`, its left edge from `xl`. That rule runs the full card height from `xl`. Shipping’s top padding is 14px below `xl` and 20px from `xl`; the other sides are 16px below `xl`. Payment padding is 16px, 20px from `xl`. A digital-only cart omits shipping, and payment fills the card.

`Payment:Selection` and `Shipping:Selection` are those columns: a 16px icon plus label in a `<div>`, then [`Form:Selection`](form-input.md#formselection) rows (`type="radio"`). The `<fieldset>` is named with `aria-labelledby` on that div. Payment uses `credit-card`; shipping uses `truck`. The label is 15px / 600, 16px from `xl`. Space between the label and the rows is 8px, 16px from `xl`. Rows are 16px apart. The radio is `Form:Selection`.

Payment `framed` defaults to `true`, which adds the standalone card (white, 1px linen, 12px radius) used on edit-order. Methods passes `framed` false so the shared card owns that chrome.

Description is every method’s plain text (tags stripped), truncated at 75 characters. Every shipping row passes the quoted amount as `trailing`. The selected row uses that cart delivery’s `shippingCosts.totalPrice`. Other rows are quoted for the current cart (price matrix, weight or volume, and tax) on `page.extensions.viewsTheme.shippingPrices`. Payment rows omit `trailing`.

`Checkout:Method` is removed. `Checkout:Method:Form` still wraps the confirm lists and POSTs `frontend.checkout.configure` with hidden `redirectTo` = `frontend.checkout.confirm.page`. Shipping renders only when the cart has a physical line item (`State::IS_PHYSICAL`, same as `Cart:ShippingCalculation`).

`Payment:Selection` accepts `action` (default `frontend.checkout.configure`) and `redirectTo`. Edit-order passes the change-payment-method path and an empty redirect. Edit-order shipping stays read-only [`Checkout:Success:Shipping`](checkout-success.md).

## Checkout:Confirm:Tos

Always a native checkbox on 6.7. Do **not** implement 6.8 `showTosCheckbox` auto-confirm copy.

| Prop | Default | Notes |
|------|---------|--------|
| `formId` | `confirmOrderForm` | Associated via `form=` |
| `tosUrl` / `revocationUrl` | CMS pages from `core.basicInformation.*` | |
| `formViolations` | ambient | Paths `/tos`, `/revocation` |
| `page` | ambient | `page.showRevocation` gates the revocation checkbox |

Snippets: `checkout.confirmTermsTextModal`, `checkout.confirmRevocationNoticeModal`. Modal tags match `Privacy:Note` (`<a data-ajax-modal>`).

## Checkout:Confirm:Additions

Pen component `Checkout/Before you order`. White card, 1px linen border, 12px radius, 20px padding, 16px gap between the title and the fields and between the fields. Title snippet `checkout.beforeYouOrderHeader` (20px / 600, ink).

Wraps `Checkout:Confirm:Comment` and `Checkout:DeliveryDateSelection`. That card chrome stays on this box. Comment localStorage and the delivery-date subscriber stay on those components.

Renders nothing when the customer comment is disabled and the delivery-date extension is inactive. No `data-component`.

The confirm layout mounts this tag in the aside above the summary. On mobile it sits in the closing stack.

| Prop | Default | Notes |
|------|---------|--------|
| `page` | ambient | Delivery-date extension gates the box with the comment config |
| `showComment` | `core.cart.showCustomerComment` | |

## Checkout:Confirm:Comment

Shown when `core.cart.showCustomerComment`. `Form:Textarea` name/id = `OrderService::CUSTOMER_COMMENT_KEY`.

| Hook | Attribute |
|------|-----------|
| Root | `data-component="ViewsTheme:Checkout:Confirm:Comment"` |
| Options | `customerId`, `fieldName` |

Storage key: `views-theme:checkout:comment:{customerId}`. Restore on init; save on input; remove key when empty.

## Edit-order isolation

`frontend.account.edit-order.page` must **not** mount `Checkout:Confirm` or `Checkout:Success`. Theme `storefront/page/account/order/index.html.twig` extends checkout `_page.html.twig` and mounts [`Account:Order:Edit`](account.md). Payment change reuses `Payment:Selection` with the edit-order action; shipping is read-only `Checkout:Success:Shipping`.

## Files

`components/Checkout/Confirm.*` · `components/Checkout/Confirm/{Aside,Addresses,Tos,Comment,Additions}.*` · `components/Checkout/Methods.*` · `components/Payment/Selection.*` · `components/Shipping/Selection.*` · `components/Checkout/Method/Form.*` · `storefront/page/checkout/confirm/index.html.twig` · `storefront/page/account/order/index.html.twig`

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
