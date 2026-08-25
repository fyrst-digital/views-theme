# Account pages

Theme-owned customer account area. Storefront templates are thin bridges: they `sw_extend` core and mount `<twig:ViewsTheme:…>` composers. UI lives under `components/Account/` and `components/Order/`.

Header login / register dropdown stays on [account action](account-action.md). Address **forms** stay on [`Address:Editor`](address-manager.md). Address **display** stays on [`Address:List` / `Address:Item`](address.md).

Unlike [cart page](cart-page.md), logged-in account pages have **no island refresh / no `/vi/…`**. Interactive bits are local: newsletter change-submit, addressbook search, profile accordion, order details accordion, delete/cancel `Modal`.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront `_page` | `page_account` → `Account:Page` (sidebar + main slot) |
| `Account:Page` | Layout composer — `Account:Sidebar` from `lg` + main content |
| `Account:Sidebar` | Greeting + `Account:Actions` (no logout in the nav list) + logout footer |
| `Account:Heading` | Shared h1 + intro |
| `Account:Overview` | Alerts, profile card, newsletter, default addresses, newest order |
| `Account:PersonalCard` | Name / company / email + optional profile edit |
| `Account:Newsletter` | `Form:Switch` + change → submit `frontend.account.newsletter` |
| `Account:Profile` | Personal form, credentials, email/password accordion, delete |
| `Account:Addressbook` | Default pair + search + `Address:Item` grid |
| `Account:Addressbook:Form` | Create/edit heading + `Address:Editor` |
| `Account:Orders` | Order list + `Pagination` (GET `?p=`) |
| `Order:Item` | Class VM — status, menu (`Dropdown`), summary, details accordion |
| `Order:ItemDetails` / `:Documents` | Line items (`Cart:Items`), documents, totals |
| `Order:Cancel` | Cancel `Modal` + POST `frontend.account.order.cancel` |
| `Order:Addresses` | Order billing/shipping → `Address:List` (6.7 vs 6.8). Shared with [success](checkout-success.md) |
| `Account:Order:Edit` | Complete-payment / change-payment. Minimal header, not `Checkout:Confirm` |
| `Account:Register:Page` | Login + register grid on `/account/register` |
| `Account:Recover` / `:ResetPassword` | Password recover / reset |
| `Account:GuestAuth` | Guest order login (email + zip) |
| `Account:Convert` | Guest → customer password |
| `Account:CustomerGroupRegister` | `Account:Register` + `requestedGroupId` |
| `Modal:Open` | Opens a `Modal` by `modalId` (profile delete, order cancel) |

Do **not** use core `data-form-handler` / `data-form-auto-submit` / `data-form-ajax-submit` / `data-order-detail-loader` / Bootstrap dropdown or collapse on these pages.

## Composition

```
page/account/_page.html.twig
└─ page_account → Account:Page
     ├─ Account:Sidebar → Account:Actions (header greeting, footer logout)
     └─ main → page_account_main_content
          ├─ Account:Overview
          ├─ Account:Profile
          ├─ Account:Addressbook / Addressbook:Form
          └─ Account:Orders
```

Standalone (full header, no sidebar):

```
Account:Register:Page          (base_content)
Account:Recover / ResetPassword
Account:GuestAuth
Account:CustomerGroupRegister
Account:Convert                (overrides page_account — no sidebar)
```

Edit-order (checkout `_page`, minimal chrome):

```
page/account/order/index.html.twig
├─ base_esi_header → Page:Header:Minimal
├─ page_checkout → Account:Order:Edit
│    ├─ alerts
│    ├─ Account:Heading
│    ├─ Order:Addresses
│    ├─ Checkout:Confirm:Payment   (POST edit-order.change-payment-method)
│    ├─ Checkout:Success:Shipping  (read-only, :order)
│    ├─ Cart:Items grid
│    └─ Account:Order:Edit:Aside   (Cart:Summary + update + Order:Cancel)
└─ base_esi_footer → footer-minimal
```

Desktop (`lg` / 1024px): sidebar + main (`--vi-account-page-cols`). Mobile: main only — header `Account:Action` is the nav.

Edit-order desktop (`xl` / 1260px): main + sticky aside (`--vi-account-order-edit-cols`).

## Scripts (theme-owned)

| Core (forbidden) | Theme owner |
|------------------|--------------|
| `FormHandler` / `data-form-handler` | `Form:Handler` |
| `FormAutoSubmit` (newsletter) | `Account:Newsletter` — checkbox `change` → `form.submit()` |
| `FormAjaxSubmit` + pagination | `Pagination` GET `?p=` (no listing owner on the page → native href) |
| Bootstrap collapse (profile / order details) | `Accordion` |
| Bootstrap dropdown (order actions) | `Dropdown` |
| Bootstrap modal (delete / cancel) | `Modal` + `Modal:Open` |
| Address manager listing widget | `Account:Addressbook` + `Address:Item` |
| `data-order-detail-loader` | Drop — details are SSR in `Order:ItemDetails` |

`Account:Addressbook` search filters `[data-component="ViewsTheme:Address:Item"]` client-side (same pattern as `Address:Manager:List`). Empty / no-results use `Address:Manager:Status`.

## Account:Actions active state

Optional action key `activePrefix` marks the item active when `activeRoute` starts with that prefix. Address uses `frontend.account.address` so create/edit stay highlighted. Exact `route` match is the default.

## Account:Register extras

| Prop | Default | Notes |
|------|---------|--------|
| `requestedGroupId` | `null` | Hidden input — customer-group register |
| `onlyCompanyRegistration` | `false` | Forwarded to `Address:Personal` |

## Order:Item

Class VM. 6.7 uses `transactions.last` / `deliveries.first`; 6.8 uses `primaryOrderTransaction` / `primaryOrderDelivery`.

| Derived | Role |
|---------|------|
| `isPaymentNeeded` | Failed / reminded / unconfirmed / cancelled payment and order not cancelled |
| `allowChangePayment` | `OrderService::ALLOWED_TRANSACTION_STATES` |
| `allowOrderCancellation` | Open + `core.cart.enableOrderRefunds` |

Menu: change/complete payment, reorder (`frontend.checkout.line-item.add`), cancel (`Order:Cancel`). Details: `Accordion` → `Order:ItemDetails` → `Cart:Items` + `Order:Documents` + totals.

## Storefront bridges

| File | Mount |
|------|--------|
| `page/account/_page.html.twig` | `Account:Page` |
| `page/account/index.html.twig` | `Account:Overview` |
| `page/account/profile/index.html.twig` | `Account:Profile` |
| `page/account/addressbook/index.html.twig` | `Account:Addressbook` |
| `page/account/addressbook/create.html.twig` / `edit.html.twig` | `Account:Addressbook:Form` |
| `page/account/order-history/index.html.twig` | `Account:Orders` |
| `page/account/order/index.html.twig` | `Account:Order:Edit` |
| `page/account/register/index.html.twig` | `Account:Register:Page` |
| `page/account/profile/recover-password.html.twig` | `Account:Recover` |
| `page/account/profile/reset-password.html.twig` | `Account:ResetPassword` |
| `page/account/guest-auth.html.twig` | `Account:GuestAuth` |
| `page/account/convert.html.twig` | `Account:Convert` |
| `page/account/customer-group-register/index.html.twig` | `Account:CustomerGroupRegister` |

Existing row bridges stay: `addressbook/address-item.html.twig` → `Address:Item`; `address-actions.html.twig` → `Address:ItemActions`; `component/account/login.html.twig` → `Account:Login`.

## Files

`components/Account/{Page,Sidebar,Heading,Overview,Newsletter,Profile,Addressbook,Orders,Recover,ResetPassword,GuestAuth,Convert,CustomerGroupRegister}.*` · `components/Account/{Profile,Addressbook,Register,Order}/**` · `components/Order/{Item,ItemDetails,ItemDetailsList,Documents,Cancel,Addresses,SummaryItem}.*` · `components/Modal/Open.*` · `storefront/page/account/**`

## Out of scope

- Footer / header chrome on logged-in account pages (full storefront header)
- Redesigning `Page:Header:Minimal` for edit-order guest back-to-order
- Core plugin unregister
- Payment-method listing as its own account route (profile + edit-order cover it)

## Related

- [Account action](account-action.md)
- [Address](address.md)
- [Address manager](address-manager.md)
- [Checkout register](checkout-register.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Form input](form-input.md)
- [Accordion](accordion.md)
- [Pagination](pagination.md)
- [JavaScript](../conventions/javascript.md)
