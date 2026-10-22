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
| `Checkout:Confirm` | Layout composer — flashes, violations, `Checkout:Confirm:Title`, addresses, methods, items, then `Checkout:Aside`. No page JS. Does not mount `Stepper` or `Cart:Heading` |
| `Checkout:Confirm:Title` | Class view-model. `#[PostMount]` builds `heading` and keyed `meta` (`email`, `items`, `arrival`) from the cart and customer. Fills `Checkout:Title`’s `description` block with `header.supportInfo`. Passes Confirm’s grid class through. No `g-col-*` in its CVA |
| `Checkout:Title` | Shared class view-model. `heading` string and `meta` as `array<string, CheckoutTitleMeta>` (`label`, optional `icon`). Each entry renders in `{% block meta_item %}` (`key` and `item` in scope). The meta container and the items wrapper are `div`s. The `description` block is empty. No `g-col-*` in its CVA |
| `Checkout:Aside` | Sidebar column (`<aside>`). Confirm gives it `g-col-1 g-col-xl-3`. Below `xl` it stacks after main. Mounts `Checkout:Additions` then `Checkout:Summary` |
| `Checkout:Summary` | Sticky summary card: `Cart:Summary` nested as-is, arrival range, TOS, place-order, secure note. Not `Cart:Page:Aside` / `Register:Aside` |
| `Checkout:Confirm:Addresses` | Confirm address panel. Class view-model builds the cards and country-format lines; Twig composes the columns and `Address:Manager:Action`. Not [`Address:List`](address.md) |
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
├─ base_esi_header → Page:Header:Minimal supportDisplay="desktop"   (inline, no ESI)
│    ├─ Page:Logo
│    ├─ header.supportInfo            (hidden below xl on confirm)
│    └─ Button (frontend.home.page)
├─ page_checkout → Checkout:Confirm        (.grid; grid-columns-1, grid-columns-xl-8; no data-component, no Stepper)
│    ├─ Cart:Flashes                       (g-col-1 g-col-xl-8)
│    ├─ formViolations → Alert             (g-col-1 g-col-xl-8)
│    ├─ Checkout:Confirm:Title            (caller class: g-col-1 g-col-xl-8 g-col-xxl-12)
│    │    └─ Checkout:Title
│    │         ├─ h1 heading prop          (checkout.confirmHeader)
│    │         ├─ description block        (Confirm:Title: header.supportInfo, hidden from xl)
│    │         └─ meta                     (keyed CheckoutTitleMeta: email · items · arrival; block meta_item)
│    ├─ main                               (g-col-1 g-col-xl-5)
│    │    ├─ checkout.confirmAddresses + Checkout:Confirm:Addresses
│    │    │    (not Address:List; change is Address:Manager:Action)
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
│              ├─ Cart:Summary                       (as-is; row tweaks scoped on this card)
│              ├─ arrival range                     (first delivery deliveryDate; omit if none)
│              ├─ Checkout:Confirm:Tos               (tos + revocation)
│              ├─ Form:Handler#confirmOrderForm → hash + Button submit (`blockResubmit`)
│              └─ secure note                       (`checkout.confirmSecureNote`)
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): eight equal tracks (`grid-columns-xl-8`). Flashes, violations, and the title span the row (`g-col-xl-8`). Main is `g-col-xl-5` and `Checkout:Aside` is `g-col-xl-3`. Column gap is 64px (`column-gap-xl-9`). Row gap is 32px (`row-gap-7`). Inside the xl container that aside is about 399px; from `xxl` the container grows and the aside grows with it. Main section gap is 40px. Root padding is 40px / 64px. The summary card stays `position-xl-sticky`; `top` is `--vi-top` (`24px`).

Mobile: one track (`grid-columns-1`), so every direct child is `g-col-1`. Title, addresses, payment and delivery, and items stack with a 32px row gap (top padding 24px). `Checkout:Aside` follows as the closing stack: `Additions` then `Summary` (gap 16px, padding 20px / 28px). The horizontal inset stays the storefront container, shared with the minimal header (pen page inset 160px / 16px).

`Stepper` is not mounted. `Cart:Items` stays the stacked list for the cart drawer and the register aside. Comment localStorage and the delivery-date subscriber stay on those components; `Additions` is the chrome around them. Confirm does not mount `Comment` or `DeliveryDateSelection` itself.

TOS lives **in the summary** with submit (not top of main). Associated fields (`tos`, `revocation`, `customerComment`, `viewsThemeDeliveryDate`) use `form="confirmOrderForm"`.

## Checkout:Confirm:Title

`Checkout:Confirm` mounts `<twig:ViewsTheme:Checkout:Confirm:Title>` and passes `page`. The component is class-backed. `#[PostMount]` builds `heading` (`checkout.confirmHeader`) and `meta` as `array<string, CheckoutTitleMeta>`. The template does not calculate those values. The grid span is Confirm’s `title` class (`g-col-1 g-col-xl-8 g-col-xxl-12`), passed through onto `Checkout:Title`. `Checkout:Confirm:Title` has no element of its own and no `g-col-*` in its CVA.

`meta` keys: `email` (customer email via `EmailIdnConverter::decode`, omitted when empty), `items` (`checkout.itemCounter` with the cart line-item count), and `arrival` (`checkout.confirmArrival`, omitted when the cart has no delivery). Each entry is a label with no icon. The support line stays in Twig: `header.supportInfo` in `vi-checkout-confirm-title__description` (`d-xl-none fs-6 text-body-tertiary`), so that line shows only below `xl`.

Arrival uses the first cart delivery’s `deliveryDate.earliest` / `latest` — the dates Shopware already stores on the delivery, not the preferred-delivery-date field. Same month renders as a day plus the later day and month (`checkout.confirmArrival`, pen shape “Arrives 16–20 October”). The arrival segment is omitted when the cart has no delivery.

## Checkout:Title

`Checkout:Confirm:Title` mounts `<twig:ViewsTheme:Checkout:Title>` with a `heading` string and `meta`. It does not pass `page`. `Checkout:Title` is class-backed. `#[PostMount]` maps each hash to `CheckoutTitleMeta` (`label`, optional `icon` for `vi_icon`), keeps the caller key, and drops an empty label.

`checkout.confirmHeader` is the h1 (30px, 600; from `xl` 36px, 600, letter-spacing `-0.7px`). The meta container is a `div`. An inner `div` holds the items. `{% block meta_item %}` renders once per entry with `key` and `item` in scope, so a caller can override that block and branch on `key`. A middot sits between items, outside the block. Title omits the line when nothing remains. An `icon` renders with `vi_icon` before its label. Meta type is 14px below `xl` and 16px from `xl`.

The `description` block on `Checkout:Title` is empty. `Checkout:Confirm:Title` fills it. Confirm also passes `supportDisplay="desktop"` on the minimal header so that header hides the same snippet from `xl`. Register, success, and edit-order do not pass it, so their header keeps support at every width.

Section titles (`checkout.confirmAddresses`, `checkout.confirmItems`, and `checkout.confirmMethods` on `Checkout:Methods`) are 20px / 600. The returns note (`checkout.confirmReturns`, `arrow-counter-clockwise` at 14px) sits beside `LineItems:Table`, not inside it.

## Checkout:Aside

Sidebar landmark. Root is `<aside>`. `Checkout:Confirm` mounts it and passes `page`, with `g-col-1 g-col-xl-3` on that tag. The column layout lives here: flex column, gap 16px (24px from `xl`), padding-top 20px below `xl`, padding-bottom 28px below `xl`.

Blocks: `additions` (`Checkout:Additions`), `summary` (`Checkout:Summary`). Sticky stays on the summary card.

## Checkout:Summary

Summary card for confirm only. Root is a `div`; the landmark is `Checkout:Aside`. Chrome (coral accent, linen border, 12px radius, 28px padding) is on this card. `Cart:Summary` is nested as-is. Row size, the divider before the grand total, and muted labels are scoped under `.vi-checkout-summary` so the cart page summary does not change. The card stays `position-xl-sticky`; `top` is `--vi-top` (`24px`).

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

Class view-model (`Addresses.php`). `#[PostMount]` resolves the defaults below and builds `cards` (shipping, then billing). The template only composes CVA, attributes, the warning, and `Address:Manager:Action`.

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

When the ids match and shipping is visible, billing shows `equalTitle` and `equalText`. Shipping still shows the address.

Lines come from the country address format (same renderer as [`Address`](address.md)). `Addresses.php` renders `@Framework/snippets/render.html.twig` with the country’s translated `addressFormat`, then splits `<br>`, `<br/>`, and `<br />`. The template prints those lines. The first line uses the pen name style; later lines are the ash body. Additional street lines stay separate. A missing country or format yields no lines.

Change stays `Address:Manager:Action` (`tab` shipping/billing, `hideShipping` from `hideShippingAddress`). Fallback `href` is `frontend.account.address.edit.page`. Visible label is `changeLabel`. `title` and `aria-label` stay `account.overviewChangeShipping` / `overviewChangeBilling`. See [address manager](address-manager.md).

Nests: `shipping`, `billing`, `shippingChange`, `billingChange`. Shared chrome (`head`, `label`, `lines`, `name`, `line`, `change`) is CVA.

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

Always a native checkbox on 6.7. Do **not** implement 6.8 `showTosCheckbox` auto-confirm copy.

| Prop | Default | Notes |
|------|---------|--------|
| `formId` | `confirmOrderForm` | Associated via `form=` |
| `tosUrl` / `revocationUrl` | CMS pages from `core.basicInformation.*` | |
| `formViolations` | ambient | Paths `/tos`, `/revocation` |
| `page` | ambient | `page.showRevocation` gates the revocation checkbox |

Snippets: `checkout.confirmTermsTextModal`, `checkout.confirmRevocationNoticeModal`. Modal tags match `Privacy:Note` (`<a data-ajax-modal>`).

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

`components/Checkout/Confirm.*` · `components/Checkout/Confirm/{Addresses,Title,Tos,Comment}.*` · `components/Checkout/{Aside,Summary,Additions,Title}.*` · `src/Struct/CheckoutTitleMeta.php` · `components/Checkout/Methods.*` · `components/Payment/Selection.*` · `components/Shipping/Selection.*` · `components/Checkout/Method/Form.*` · `storefront/page/checkout/confirm/index.html.twig` · `storefront/page/account/order/index.html.twig`

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
