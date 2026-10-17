# Checkout confirm

Theme-owned `/checkout/confirm` (`frontend.checkout.confirm.page`). Guest and empty-cart redirects stay in core `CheckoutController`.

Unlike [cart page](cart-page.md), **`Checkout:Confirm` has no `data-component` / no island JS**. Address change is nested `Address:Manager:Action` ([address manager](address-manager.md)). Line items use the cart **grid** layout, read-only — qty stepper / remove stay on the cart page.

No stepper is mounted. Shopware has no stepper and no delivery step; the pen’s Cart / Details / Delivery / Review row is an example only.

Does **not** own account edit-order / complete-payment. That page is [`Account:Order:Edit`](account.md) on checkout `_page.html.twig` (not `Checkout:Confirm`).

Does **not** mount `Stepper`. Shopware has no checkout stepper and no delivery step.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/confirm/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Confirm` |
| `Page:Header:Minimal` | Inline header (no ESI): `Page:Logo`, `header.supportInfo`, light `Button` home (`arrow-left`). `supportDisplay` defaults to `all` (support at every width); `desktop` hides it below `xl`. This page does not pass `desktop` |
| `Checkout:Confirm` | Layout composer — flashes, violations, h1, addresses, methods, grid items, comment + delivery date, aside |
| `Checkout:Confirm:Aside` | Sticky summary card: `Cart:Summary` nested as-is, arrival range, TOS, place-order, secure note. Not `Cart:Page:Aside` / `Register:Aside` |
| `Checkout:Confirm:Addresses` | Confirm address panel. Country address-format lines + `Address:Manager:Action`. Not [`Address:List`](address.md) |
| `Checkout:Confirm:Payment` / `:Shipping` | Icon + label, then `Form:Selection` radios inside `Checkout:Method:Form` |
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
│    └─ Checkout:Confirm:Aside             (sticky card)
│         ├─ Cart:Summary                  (as-is; row tweaks scoped on this aside)
│         ├─ arrival range                 (first delivery `deliveryDate`; omit if none)
│         ├─ Checkout:Confirm:Tos          (tos + revocation)
│         ├─ Form:Handler#confirmOrderForm → hash + Button submit (`blockResubmit`)
│         └─ secure note                   (`checkout.confirmSecureNote`)
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): main + sticky aside (`--vi-checkout-confirm-cols`). Aside `top` is `--vi-top` (`24px`). Mobile: stack.

TOS lives **in the aside** with submit (not top of main). Associated fields (`tos`, `revocation`, `customerComment`, `viewsThemeDeliveryDate`) use `form="confirmOrderForm"`.

## Checkout:Confirm:Aside

Summary card for confirm only. Chrome (coral accent, linen border, 12px radius, 28px padding) is on this aside. `Cart:Summary` is nested as-is. Row size, the divider before the grand total, and muted labels are scoped under `.vi-checkout-confirm-aside` so the cart page summary does not change.

Arrival is the first cart delivery’s `deliveryDate.earliest` / `latest`, rendered with `checkout.lineItemDeliveryDate`. The block is omitted when the cart has no delivery. This is not the preferred-delivery-date field.

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

`Checkout:Confirm:Payment` and `Checkout:Confirm:Shipping` are each a card: 16px icon plus label, then [`Form:Selection`](form-input.md#formselection) rows (`type="radio"`). Payment uses `credit-card`; shipping uses `truck`. Chrome is white, a 1px linen border, and 12px radius. Padding is 16px, 20px from `xl`. The label is 15px / 600, 16px from `xl`. Space between the label and the rows is 8px, 16px from `xl`. Rows are 16px apart. The radio is `Form:Selection`.

Description is the selected method’s plain text (tags stripped), truncated at 75 characters. `price` is set only on the selected shipping row, from that cart delivery’s `shippingCosts.totalPrice`. Payment rows and unselected shipping rows omit `price`.

`Checkout:Method` is removed. `Checkout:Method:Form` still wraps the confirm lists and POSTs `frontend.checkout.configure` with hidden `redirectTo` = `frontend.checkout.confirm.page`. Shipping renders only when the cart has a physical line item (`State::IS_PHYSICAL`, same as `Cart:ShippingCalculation`).

`Checkout:Confirm:Payment` accepts `action` (default `frontend.checkout.configure`) and `redirectTo`. Edit-order passes the change-payment-method path and an empty redirect. Edit-order shipping stays read-only [`Checkout:Success:Shipping`](checkout-success.md).

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

`components/Checkout/Confirm.*` · `components/Checkout/Confirm/{Aside,Addresses,Payment,Shipping,Tos,Comment}.*` · `components/Checkout/Method/Form.*` · `storefront/page/checkout/confirm/index.html.twig` · `storefront/page/account/order/index.html.twig`

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
