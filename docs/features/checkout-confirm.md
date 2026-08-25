# Checkout confirm

Theme-owned `/checkout/confirm` (`frontend.checkout.confirm.page`). Guest and empty-cart redirects stay in core `CheckoutController`.

Unlike [cart page](cart-page.md), **`Checkout:Confirm` has no `data-component` / no island JS**. Address change is nested `Address:Manager:Action` ([address manager](address-manager.md)). Line items use the cart **grid** layout, read-only — qty stepper / remove stay on the cart page.

Does **not** own account edit-order / complete-payment. Theme `storefront/page/account/order/index.html.twig` extends checkout `_page.html.twig` (not confirm) and keeps core chrome.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/confirm/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Confirm` |
| `Page:Header:Minimal` | Inline header (no ESI): `Page:Logo` + `header.supportInfo` + `Button` home |
| `Checkout:Confirm` | Layout composer — flashes, violations, h1, addresses, methods, grid items, comment + delivery date, aside |
| `Checkout:Confirm:Aside` | Sticky summary + TOS + place-order. Not `Cart:Page:Aside` / `Register:Aside` |
| `Checkout:Confirm:Addresses` | Adapter: customer addresses → [`Address:List`](address.md) + `Address:Manager:Action` |
| `Checkout:Confirm:Payment` / `:Shipping` | Method lists via `Checkout:Method` + `Checkout:Method:Form` |
| `Checkout:Method` | Payment/shipping radio primitive (`interactive=false` on [success](checkout-success.md)) |
| `Checkout:Method:Form` | POST `frontend.checkout.configure`; native change → submit |
| `Checkout:Confirm:Tos` | Required `tos` (+ `revocation` when `page.showRevocation`). Modal links like `Privacy:Note` |
| `Checkout:Confirm:Comment` | `Form:Textarea` + comment-only localStorage persist |
| `Checkout:DeliveryDateSelection` | Remount next to comment. Subscribers unchanged ([delivery-date](delivery-date.md)) |
| `Form:Handler` | `#confirmOrderForm` owner — hash + submit (`frontend.checkout.finish.order`) |
| Footer | Core `footer-minimal` via untouched `base_esi_footer` |

Do **not** add `storefront/layout/header/header-minimal.html.twig`. Success also uses `Page:Header:Minimal` — [checkout-success](checkout-success.md).

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
│    ├─ Checkout:Confirm:Addresses → Address:List
│    │    ├─ shipping card (unless hideShippingAddress) → Address:Manager:Action
│    │    └─ billing card (or checkout.addressEqualText) → Address:Manager:Action
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
└─ base_esi_footer → core footer-minimal (untouched)
```

Desktop (`xl` / 1260px): main + sticky aside (`--vi-checkout-confirm-cols`). Aside `top` is `--vi-top` (`24px`). Mobile: stack.

TOS lives **in the aside** with submit (not top of main). Associated fields (`tos`, `revocation`, `customerComment`, `viewsThemeDeliveryDate`) use `form="confirmOrderForm"`.

## Scripts (theme-owned — no core form plugins)

| Core (forbidden) | Theme owner |
|------------------|-------------|
| `FormHandler` / `data-form-handler` / `data-form-submit-loader` | `Form:Handler` on `#confirmOrderForm` |
| `FormAutoSubmit` / `data-form-auto-submit` | `Checkout:Method:Form` — radio `change` → `form.submit()` |
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

`frontend.account.edit-order.page` must **not** mount `Checkout:Confirm` or `Checkout:Success`. Theme stub `storefront/page/account/order/index.html.twig` extends `@Storefront/storefront/page/checkout/_page.html.twig` and keeps core complete-payment includes (order header, address, payment/shipping, line-item table, update-order form, cancel modal). Redesign is a later issue.

## Files

`components/Checkout/Confirm.*` · `components/Checkout/Confirm/{Aside,Addresses,Payment,Shipping,Tos,Comment}.*` · `components/Checkout/Method.*` · `components/Checkout/Method/Form.*` · `storefront/page/checkout/confirm/index.html.twig` · `storefront/page/account/order/index.html.twig`

## Out of scope

- Footer / `footer-minimal`
- Account edit-order redesign (isolation stub only)
- Addressbook listing page / account overview / edit-order address chrome
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
- [JavaScript](../conventions/javascript.md)
