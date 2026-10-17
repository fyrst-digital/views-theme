# Checkout confirm

Theme-owned `/checkout/confirm` (`frontend.checkout.confirm.page`). Guest and empty-cart redirects stay in core `CheckoutController`.

Unlike [cart page](cart-page.md), **`Checkout:Confirm` has no `data-component` / no island JS**. Address change is nested `Address:Manager:Action` ([address manager](address-manager.md)). Line items use the cart **grid** layout, read-only — qty stepper / remove stay on the cart page.

Does **not** own account edit-order / complete-payment. That page is [`Account:Order:Edit`](account.md) on checkout `_page.html.twig` (not `Checkout:Confirm`).

The pen stepper is not mounted on confirm. Shopware has no stepper and no delivery step.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/confirm/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Confirm` |
| `Page:Header:Minimal` | Inline header (no ESI): `Page:Logo`, `header.supportInfo`, light `Button` home (`arrow-left`). `supportDisplay` defaults to `all` (support at every width); `desktop` hides it below `xl`. This page does not pass `desktop` |
| `Checkout:Confirm` | Layout composer — flashes, violations, h1, addresses, methods, grid items, comment + delivery date, aside |
| `Checkout:Confirm:Aside` | Sticky summary + TOS + place-order. Not `Cart:Page:Aside` / `Register:Aside` |
| `Checkout:Confirm:Addresses` | Confirm address panel. Country address-format lines + `Address:Manager:Action`. Not [`Address:List`](address.md) |
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
├─ base_esi_header → Page:Header:Minimal   (inline, no ESI)
│    ├─ Page:Logo
│    ├─ header.supportInfo
│    └─ Button (frontend.home.page)
├─ page_checkout → Checkout:Confirm        (no data-component)
│    ├─ Cart:Flashes
│    ├─ formViolations → Alert
│    ├─ Cart:Heading (h1, checkout.confirmHeader + count)
│    ├─ Checkout:Confirm:Addresses
│    │    ├─ shipping column (unless hideShippingAddress) → Address:Manager:Action
│    │    └─ billing column (or equal-address snippets) → Address:Manager:Action
│    ├─ Checkout:Confirm:Payment
│    ├─ Checkout:Confirm:Shipping          (if physical line item)
│    ├─ Cart:Items grid, showRemoveButton=false, showQuantitySelect=false
│    ├─ additional
│    │    ├─ Checkout:Confirm:Comment      (if core.cart.showCustomerComment)
│    │    └─ Checkout:DeliveryDateSelection
│    └─ Checkout:Confirm:Aside
│         ├─ Cart:Summary
│         ├─ Checkout:Confirm:Tos          (tos + revocation)
│         └─ Form:Handler#confirmOrderForm → hash + Button submit
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): main + sticky aside (`--vi-checkout-confirm-cols`). Aside `top` is `--vi-top` (`24px`). Mobile: stack.

TOS lives **in the aside** with submit (not top of main). Associated fields (`tos`, `revocation`, `customerComment`, `viewsThemeDeliveryDate`) use `form="confirmOrderForm"`.

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
