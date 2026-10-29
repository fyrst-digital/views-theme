# Checkout register

Theme-owned `/checkout/register` (`frontend.checkout.register.page`). Core renders `storefront/page/checkout/address/index.html.twig` — not `checkout/register/`. Empty cart and logged-in redirects stay in core `RegisterController`.

Unlike [cart page](cart-page.md), **`Checkout:Register` has no `data-component` / no island JS / no `/vi/…`**. Aside is read-only.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/address/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Register` |
| `Page:Header:Minimal` | Inline header (no ESI). Full-bleed bar; inner `.container` owns the grid (`Page:Logo`, `Page:Support`, light `Button`). No min-height and no inline padding. `supportDisplay` stays `all`, so `Page:Support` shows at every width. Register passes `action="cart"` (`frontend.checkout.cart.page`, `checkout.backToCart`) |
| `Checkout:Register` | Layout composer — flashes, h1, always-visible login, register, aside. Ambient `__context.formViolations` (and `data` / login errors) forwarded into `Account:Register` |
| `Checkout:Register:Aside` | Sticky summary + stacked read-only line items |
| `Account:Login` | Login form (`Form:Handler`, `redirectTo` = confirm) |
| `Account:Register` | Register form (class VM, `guestSelectable`) |
| `Privacy:Note` | Register footer privacy copy (+ optional `acceptedDataProtection` checkbox) |
| Footer | [`Page:Footer:Minimal`](footer.md) via `base_esi_footer` (inline, no ESI) |

Do **not** add `storefront/layout/header/header-minimal.html.twig` or `storefront/layout/footer/footer-minimal.html.twig`. Success uses `Page:Header:Minimal` — [checkout-success](checkout-success.md). Confirm uses `Page:Header:Minimal` — [checkout-confirm](checkout-confirm.md). Footer: [footer](footer.md).

## Composition

```
page/checkout/address/index.html.twig
├─ base_esi_header → Page:Header:Minimal action="cart"   (inline, no ESI)
│    └─ .container
│         ├─ Page:Logo
│         ├─ Page:Support
│         └─ Button (frontend.checkout.cart.page, checkout.backToCart)
├─ page_checkout → Checkout:Register       (no data-component)
│    ├─ Cart:Flashes
│    ├─ heading (h1, checkout.addressHeader)
│    ├─ Account:Login (always visible; redirectTo=frontend.checkout.confirm.page)
│    ├─ Account:Register (guestSelectable, formViolations)
│    └─ Checkout:Register:Aside
│         ├─ Cart:Summary
│         └─ Cart:Items stacked, showRemoveButton=false, showQuantitySelect=false
└─ base_esi_footer → Page:Footer:Minimal :footer="footer"
```

Desktop (`xl` / 1260px): main + sticky aside (`--vi-checkout-register-cols`). Aside `top` is `--vi-top` (`24px`). Mobile: stack.

Login is **always visible** — no collapse / Accordion.

## Account:Register

Class component. `Form:Handler` posts to `frontend.account.register.save`.

| Prop | Default | Notes |
|------|---------|--------|
| `guestSelectable` | `false` | Checkout: `true` — `Account:Input:Credentials` owns `Form:Switch` `createCustomerAccount` + `Form:Toggle` around password only. Email always visible. |
| `createAccountChecked` | first load = shop `createCustomerAccountDefault`; posted key = boolean; omitted key on a **filled** bag when `guestSelectable` = guest (`false`); `guestSelectable` false always `true` | Switch + toggle open (create-account, not “guest”). Unchecked HTML checkboxes are omitted from POST — do not fall back to shop default on repost. |
| `redirectTo` | confirm (guest) / account home | Hidden input |
| `errorRoute` | checkout register / account register | Hidden input |
| `data` / `page` | | Prefill + countries / salutations |
| `formViolations` | request attribute / passed | Class `#[PostMount]` null-coalesces the Shopware request attribute when omitted. `Checkout:Register` reads ambient `__context.formViolations` and passes it; account register bridge passes `:formViolations`. Forwarded to `Account:Form:Personal` / Form / `Account:Input:Credentials` / `Privacy:Note`. |
| `requestedGroupId` | `null` | Hidden input — customer-group register |
| `onlyCompanyRegistration` | `false` | Forwarded to `Account:Form:Personal` |
| `formAction` | `frontend.account.register.save` | Leftover `component/account/register.html.twig` includes |

Same form SoT on `/account/register` (full header, no advantages list, `guestSelectable` false, hidden `createCustomerAccount=1`).

Captcha is the theme-owned [`Captcha`](captcha.md) component (core captcha JS plugins and APIs). `Form:Handler` lets the native `submit` event continue after validation so captcha plugins can attach a token — it does not call `HTMLFormElement.prototype.submit()`. Privacy is `Privacy:Note` (nest `privacy`).

`formViolations` is a Shopware request attribute (Twig global via `TemplateDataExtension`). Class VMs (`Account:Register`, `Account:Input:Birthday`, `Address:Input:*`) null-coalesce it in `#[PostMount]` when the prop is omitted. `Address:Form` and `Account:Form:Personal` are anonymous and default the prop from `__context`. `Checkout:Register` and the account register page also pass it explicitly.

## Privacy:Note

Anonymous UX. Replaces core `privacy-notice.html.twig` on theme-owned register. No `data-component`. CMS contact/newsletter keep the core include.

| Prop | Default | Notes |
|------|---------|--------|
| `title` | `general.privacyTitle` | Omit when empty |
| `snippet` | `general.privacyNoticeTextModal` | `%privacyModalTagOpen%` / `%tosModalTagOpen%` wrap `<a data-ajax-modal>` |
| `privacyUrl` / `tosUrl` | CMS pages from `core.basicInformation.*` | |
| `requireCheckbox` | `core.loginRegistration.requireDataProtectionCheckbox == 1` | Native checkbox `acceptedDataProtection` + `required` (not `Form:Switch`) |
| `id` / `name` | `acceptedDataProtection` | RegisterRoute `NotBlank` when required |
| `formViolations` | `__context` default; `Account:Register` passes explicitly | Path `/acceptedDataProtection`. Nested UX isolates page scope, so register must forward the prop. |

The notice is one `text` slot (`{% block text %}`). That element is a `label` with `for` set to the checkbox id when `requireCheckbox` is true; otherwise it is a `div`. With the checkbox, the label sits inside the control flex row so `col` grows beside the input. Feedback stays after the control. Both modes use `vi_attrs('text')` and `vi_class('text', { checkbox: requireCheckbox })`. CVA `text` base is `vi-privacy-note__text mb-0`; `checkbox: true` adds `form-check-label col cursor-pointer`. Callers style the notice with `text:class`.

Links use CVA `link` (`fw-semibold text-body`), same ajax-modal pattern as `Product:Price:Tax`. Required-fields hint stays on `Account:Register` footer.

## Address fields

`Address:Form` and `Account:Form:Personal` are anonymous composers. Personal mounts `Address:Input:AccountType` / `Salutation` / `Title` / `Name` / `Company` and `Account:Input:Birthday` (class). Form mounts `Address:Input:Street` / `Postal` / `Country` / `Phone` (class). Email/password fields are `Account:Input:Credentials` (email always visible; password gated when `guestSelectable`). Profile passes `showCompanyFields: true` so company/VAT stay visible when the shop hides the account-type select.

`Account:Form:Personal` renders an optional heading (`heading` prop, element via `headingTag`, default `h2`; `{% block heading %}`, CVA slot `heading`) before the grid; `Address:Form` has the same optional `heading` / `headingTag` (CVA slot `heading`). `Account:Register` passes `viewsTheme.account.personalHeading` (billing personal), `account.registerAddressBillingHeader` (billing address form) and `account.registerAddressShippingHeader` (shipping personal). There are no `fieldset` wrappers around those sections — `Form:Toggle` content is already a `fieldset`. It keeps the public props (`data`, `prefix`, `idPrefix`, `page`, `salutations`, `accountType`, `hideCustomerTypeSelect`, `onlyCompanyRegistration`, `showBirthdayField`, `showVat`, `showCompanyFields`, `formViolations`) and forwards them. Each input builds its own field codes. Account type owns the private/business select, the hidden input when registration is company-only, and the `Form:Toggle` that discloses `Address:Input:Company`. Salutation, title, and birthday render nothing when their `core.loginRegistration.show*` flag is off. `Account:Input:Birthday` still honors `showBirthdayField` and `birthdayFieldRequired`, and passes `prefix: null` into `Form:Birthday` so the names stay `birthdayDay` / `birthdayMonth` / `birthdayYear`. Salutation and name are full-width nested grids (`columns="1-md:6"`, `gap="sm"`). The salutation select and each name field stay half of their own row (`g-col-md-3`), so title cannot sit beside either row.

Fields sit in `Grid` `columns="1-md:6"` (one column, six tracks from `md`). Each Form slot is one full row (`g-col-1 g-col-md-6`). Inside the row, zip and city are halves (`g-col-md-3`); country and state are halves when the country displays a state, and the country cell is `g-col-md-6` when it does not. Street lines stay full width inside `Address:Input:Street`. No Bootstrap `row` / `col-md-*`. Personal slots are `prepend`, `accountType`, `company`, `salutation`, `title`, `name`, `birthday`, `append` ([`{% vi_block %}`](../twig/vi-block.md)). Form slots are `street`, `postal`, `country`, `phone`. `company` is forwarded into `Address:Input:AccountType`. `firstName` / `lastName` live on `Address:Input:Name`. `{% block fields %}` stays a real Personal slot (it wraps Grid).

`Address:Input:Street` reads `showAdditionalAddressField*` / `additionalAddressField*Required` and skips a line when its flag is off. `Address:Input:Postal` orders zip and city from `core.loginRegistration.addressInputFieldArrangement`, keeping only `zip` and `city`. The `state` token in that setting does not place the state field. `Address:Input:Phone` renders only when `showPhoneNumberField` is on, and is required when `phoneNumberFieldRequired` is on.

`Address:Input:Country` is the country and state row (`data-component="ViewsTheme:Address:Input:Country"` on the row grid). It fetches `frontend.country.country.data`. `data-component-options` is only `countryDataUrl`. Country flags live on each `<option>`: `data-zip-required`, `data-state-required`, `data-vat-required`, `data-state-displayed` (`true` / `false`). The country `<select>` is the one named `countryId` or `[countryId]`. Zip and VAT are `form.elements` names from that prefix (`{prefix}[zipcode]`; no prefix → `zipcode`). VAT uses the `Address:Input:Company` name rule: `vatIds[]` when the prefix is empty or `billingAddress`, otherwise `{prefix}[vatIds][]`. The state `Form:Select` root (parent of the state `<select>`) is hidden when that country does not display a state, and the country cell switches between `g-col-md-3` and `g-col-md-6`. A shipping country change does not address the billing state or VAT input.

Guest password, different-shipping, and company visibility use `Form:Toggle` (control + content; `hidden` / `inert` / `fieldset disabled`). Nested toggles `sync()` via instance lookup — no PluginManager / CSS targets.

## Shared SoT bridges

| Bridge | Mount |
|--------|--------|
| `storefront/page/account/register/index.html.twig` | `Account:Register:Page` → `Tabs` → `Account:Login` (column) + `Account:Register` (no card title) |
| `storefront/component/account/register.html.twig` | `Account:Register` |
| `storefront/component/account/customer-group-register.html.twig` | `Account:Register` + `requestedGroupId` |
| `storefront/page/account/addressbook/create.html.twig` / `edit.html.twig` | `Account:Addressbook:Form` → `Address:Editor` |
| `storefront/page/account/addressbook/address-item.html.twig` | `Address:Item` |
| `storefront/page/account/addressbook/address-actions.html.twig` | `Address:ItemActions` |
| `storefront/component/account/login.html.twig` | `Account:Login` |

`Address:Editor` composes `Account:Form:Personal` + Form + `Form:Handler` (native submit on account pages; `preventNative` in the manager modal). No `data-form-ajax-submit`. Checkout register keeps `Account:Form:Personal` + Form inside `Account:Register` (not Editor). Address-book **listing** is [`Account:Addressbook`](account.md) — listing rows use [`Address:Item`](address.md). See [address manager](address-manager.md).

## Files

`components/Checkout/Register.*` · `components/Checkout/Register/Aside.*` · `components/Page/Header/Minimal.*` · `components/Account/Register.*` · `components/Account/Form/Personal.*` · `components/Account/Input/Birthday.*` · `components/Account/Input/Credentials.*` · `components/Privacy/Note.*` · `components/Address.{html.twig,cva.twig}` · `components/Address/{List,Form,Item,ItemActions,Editor}.*` · `components/Address/Input/{AccountType,Salutation,Title,Name,Company,Street,Postal,Country,Phone}.*` · `src/Service/ComponentData.php`

## Related

- [Address](address.md)
- [Address manager](address-manager.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Cart page](cart-page.md)
- [Form input](form-input.md)
- [Account pages](account.md)
- [Account action](account-action.md)
- [Grid](grid.md)
- [Footer](footer.md)
- [JavaScript](../conventions/javascript.md)
