# Checkout confirm

Theme-owned `/checkout/confirm` (`frontend.checkout.confirm.page`). Guest and empty-cart redirects stay in core `CheckoutController`.

Unlike [cart page](cart-page.md), **`Checkout:Confirm` has no `data-component` / no island JS**. Address change is nested `Address:Manager:Action` ([address manager](address-manager.md)). Line items are a read-only `LineItems:Table` — qty stepper / remove stay on the cart page. `Stepper` is not mounted.

Does **not** own account edit-order / complete-payment. That page is [`Account:Order:Edit`](account.md) on checkout `_page.html.twig` (not `Checkout:Confirm`).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/confirm/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Confirm` |
| `Page:Header:Minimal` | Inline header (no ESI): `Page:Logo` + `header.supportInfo` + `Button` home. Confirm passes `supportDisplay="desktop"` so support is hidden below `xl` |
| `Checkout:Confirm` | Layout composer — flashes, violations, title, addresses, payment then shipping, items, closing stack (`Additions` then `Aside`). No page JS |
| `Checkout:Confirm:Aside` | Sticky summary + TOS + place-order. Not `Cart:Page:Aside` / `Register:Aside` |
| `Checkout:Confirm:Addresses` | Adapter: customer addresses → [`Address:List`](address.md) + `Address:Manager:Action` |
| `Checkout:Confirm:Payment` / `:Shipping` | Method lists via `Checkout:Method` + `Checkout:Method:Form` |
| `Checkout:Method` | Payment/shipping radio primitive (`interactive=false` on [success](checkout-success.md)) |
| `Checkout:Method:Form` | POST `frontend.checkout.configure`; native change → submit |
| `Checkout:Confirm:Tos` | Required `tos` (+ `revocation` when `page.showRevocation`). Modal links like `Privacy:Note` |
| `Checkout:Confirm:Comment` | `Form:Textarea` + comment-only localStorage persist |
| `Checkout:DeliveryDateSelection` | Remount next to comment. Subscribers unchanged ([delivery-date](delivery-date.md)) |
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
│    │    ├─ checkout.confirmAddresses + Checkout:Confirm:Addresses → Address:List
│    │    ├─ checkout.confirmMethods
│    │    │    ├─ Checkout:Confirm:Payment
│    │    │    └─ Checkout:Confirm:Shipping          (if physical line item)
│    │    └─ checkout.confirmItems
│    │         ├─ LineItems:Table   (cart=page.cart, showRemoveButton=false, showQuantitySelect=false)
│    │         └─ checkout.confirmReturns
│    └─ close (aside column from xl, stack after main below xl)
│         ├─ Checkout:Confirm:Additions
│         │    ├─ Checkout:Confirm:Comment           (if core.cart.showCustomerComment)
│         │    └─ Checkout:DeliveryDateSelection
│         └─ Checkout:Confirm:Aside
│              ├─ Cart:Summary
│              ├─ Checkout:Confirm:Tos               (tos + revocation)
│              └─ Form:Handler#confirmOrderForm → hash + Button submit
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): the title spans the row, then main and a 400px closing column (`--vi-checkout-confirm-aside`, column gap 56px). Title-to-columns gap is 36px. Main section gap is 40px. Root padding is 40px / 64px. The aside stays `position-xl-sticky`; `top` is `--vi-top` (`24px`).

Mobile: title, addresses, payment and delivery, and items stack with a 28px gap (padding 24px / 32px). `Additions` then `Aside` follow as the closing stack (gap 16px, padding 20px / 28px). The horizontal inset stays the storefront container, shared with the minimal header (pen page inset 160px / 16px).

`Stepper` is not mounted. Comment localStorage and the delivery-date subscriber stay on those components; `Additions` is the chrome around them. Confirm does not mount `Comment` or `DeliveryDateSelection` itself.

TOS lives **in the aside** with submit (not top of main). Associated fields (`tos`, `revocation`, `customerComment`, `viewsThemeDeliveryDate`) use `form="confirmOrderForm"`.

## Title

`checkout.confirmHeader` is the h1 (30px, 600; from `xl` 36px, 600, letter-spacing `-0.7px`). The meta line under it is the customer email, `checkout.itemCounter` with `page.cart.lineItems|length`, and an arrival range. A middot separates the segments. Meta type is 14px below `xl` and 16px from `xl`.

Arrival uses the first cart delivery’s `deliveryDate.earliest` / `latest` — the dates Shopware already stores on the delivery, not the preferred-delivery-date field. Same month renders as a day plus the later day and month (`checkout.confirmArrival`, pen shape “Arrives 16–20 October”). The arrival segment is omitted when the cart has no delivery.

Below `xl`, `header.supportInfo` sits between the heading and the meta. Confirm passes `supportDisplay="desktop"` so the header hides that same snippet under the desktop breakpoint. Register, success, and edit-order do not pass it, so their header keeps support at every width.

Section titles on the page (`checkout.confirmAddresses`, `checkout.confirmMethods`, `checkout.confirmItems`) are 20px / 600. The returns note (`checkout.confirmReturns`, `arrow-counter-clockwise` at 14px) sits beside `LineItems:Table`, not inside it.

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

Thin adapter. Card chrome lives on [`Address:List`](address.md) (`showShippingWarning=true`). This tag keeps customer defaults and change buttons.

| Prop | Default | Notes |
|------|---------|--------|
| `page` | required | |
| `billingAddress` | `context.customer.activeBillingAddress` | |
| `shippingAddress` | `context.customer.activeShippingAddress` | |
| `hideShippingAddress` | `page.hideShippingAddress` | Digital-only |

Change buttons are `Address:Manager:Action` in `shippingActions` / `billingActions` (`tab` shipping/billing, `hideShipping` from `hideShippingAddress`). Fallback `href` is `frontend.account.address.edit.page`. See [address manager](address-manager.md).

Nests: `shippingChange`, `billingChange`. Card nests (`grid`, `shipping`, `billing`, `title`, `body`, `equal`) are on `Address:List`.

## Checkout:Method / Method:Form

`Checkout:Method` is the radio row (replaces leftover `MethodOption`).

| Prop | Default | Notes |
|------|---------|--------|
| `methodType` | `'payment'` | Builds `name` (`paymentMethodId` / `shippingMethodId`) and input id |
| `methodId` | required | Radio value |
| `selectedMethodId` | `null` | |
| `disabled` | `false` | |
| `interactive` | `true` | `false` → no radio, `div` chrome (success recap) |
| `media` / `name` / `description` | | Description only passed for the selected method |

`Checkout:Method:Form` POSTs `frontend.checkout.configure` with hidden `redirectTo` = `frontend.checkout.confirm.page`. Shipping is gated with `State::IS_PHYSICAL` (same as `Cart:ShippingCalculation`).

`Checkout:Confirm:Payment` accepts `action` (default `frontend.checkout.configure`) and `redirectTo`. Edit-order passes the change-payment-method path and an empty redirect.

## Checkout:Confirm:Tos

Always a native checkbox on 6.7. Do **not** implement 6.8 `showTosCheckbox` auto-confirm copy.

| Prop | Default | Notes |
|------|---------|--------|
| `formId` | `confirmOrderForm` | Associated via `form=` |
| `tosUrl` / `revocationUrl` | CMS pages from `core.basicInformation.*` | |
| `formViolations` | ambient | Paths `/tos`, `/revocation` |
| `page` | ambient | `page.showRevocation` gates the revocation checkbox |

Snippets: `checkout.confirmTermsTextModal`, `checkout.confirmRevocationNoticeModal`. Modal tags match `Privacy:Note` (`<a data-ajax-modal>`).

## Checkout:Confirm:Comment

Shown when `core.cart.showCustomerComment`. `Form:Textarea` name/id = `OrderService::CUSTOMER_COMMENT_KEY`.

| Hook | Attribute |
|------|-----------|
| Root | `data-component="ViewsTheme:Checkout:Confirm:Comment"` |
| Options | `customerId`, `fieldName` |

Storage key: `views-theme:checkout:comment:{customerId}`. Restore on init; save on input; remove key when empty.

## Edit-order isolation

`frontend.account.edit-order.page` must **not** mount `Checkout:Confirm` or `Checkout:Success`. Theme `storefront/page/account/order/index.html.twig` extends checkout `_page.html.twig` and mounts [`Account:Order:Edit`](account.md). Payment change reuses `Checkout:Confirm:Payment` with the edit-order action; shipping is read-only `Checkout:Success:Shipping`.

## Files

`components/Checkout/Confirm.*` · `components/Checkout/Confirm/{Aside,Addresses,Payment,Shipping,Tos,Comment}.*` · `components/Checkout/Method.*` · `components/Checkout/Method/Form.*` · `storefront/page/checkout/confirm/index.html.twig` · `storefront/page/account/order/index.html.twig`

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
