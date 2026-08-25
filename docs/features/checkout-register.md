# Checkout register

Theme-owned `/checkout/register` (`frontend.checkout.register.page`). Core renders `storefront/page/checkout/address/index.html.twig` — not `checkout/register/`. Empty cart and logged-in redirects stay in core `RegisterController`.

Unlike [cart page](cart-page.md), **`Checkout:Register` has no `data-component` / no island JS / no `/vi/…`**. Aside is read-only.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/address/index.html.twig` → `base_esi_header` = `Page:Header:Minimal`; `page_checkout` = `Checkout:Register` |
| `Page:Header:Minimal` | Inline header (no ESI): `Page:Logo` + `header.supportInfo` + `Button` home |
| `Checkout:Register` | Layout composer — flashes, h1, always-visible login, register, aside |
| `Checkout:Register:Aside` | Sticky summary + stacked read-only line items |
| `Account:Login` | Login form (`Form:Handler`, `redirectTo` = confirm) |
| `Account:Register` | Register form (class VM, `guestSelectable`) |
| `Privacy:Note` | Register footer privacy copy (+ optional `acceptedDataProtection` checkbox) |
| Footer | Core `footer-minimal` via untouched `base_esi_footer` |

Do **not** add `storefront/layout/header/header-minimal.html.twig`. Confirm/finish keep core `header-minimal`.

## Composition

```
page/checkout/address/index.html.twig
├─ base_esi_header → Page:Header:Minimal   (inline, no ESI)
│    ├─ Page:Logo
│    ├─ header.supportInfo
│    └─ Button (frontend.home.page)
├─ page_checkout → Checkout:Register       (no data-component)
│    ├─ Cart:Flashes
│    ├─ heading (h1, checkout.addressHeader)
│    ├─ Account:Login (always visible; redirectTo=frontend.checkout.confirm.page)
│    ├─ Account:Register (guestSelectable)
│    └─ Checkout:Register:Aside
│         ├─ Cart:Summary
│         └─ Cart:Items stacked, showRemoveButton=false, showQuantitySelect=false
└─ base_esi_footer → core footer-minimal (untouched)
```

Desktop (`xl` / 1260px): main + sticky aside (`--vi-checkout-register-cols`). Aside `top` is `--vi-top` (`24px`). Mobile: stack.

Login is **always visible** — no collapse / Accordion.

## Account:Register

Class component. `Form:Handler` posts to `frontend.account.register.save`.

| Prop | Default | Notes |
|------|---------|--------|
| `guestSelectable` | `false` | Checkout: `true` — Credentials owns `Form:Switch` `createCustomerAccount` + `Form:Toggle` around password only. Email always visible. |
| `createAccountChecked` | config / posted | Switch + toggle open (create-account, not “guest”). Empty `data` → shop default; posted bag → `createCustomerAccount` boolean (missing checkbox = guest) |
| `redirectTo` | confirm (guest) / account home | Hidden input |
| `errorRoute` | checkout register / account register | Hidden input |
| `data` / `page` | | Prefill + countries / salutations |
| `formViolations` | request attribute / passed | Class `#[PostMount]` null-coalesce; forwarded into Personal / Form / Credentials / Privacy |

Same form SoT on `/account/register` (full header, no advantages list, `guestSelectable` false, hidden `createCustomerAccount=1`).

Captcha stays a core include. `Form:Handler` lets the native `submit` event continue after validation so captcha plugins can attach a token — it does not call `HTMLFormElement.prototype.submit()`. Privacy is `Privacy:Note` (nest `privacy`).

`formViolations` is a Shopware request attribute (Twig global via `TemplateDataExtension`). Class VMs (`Account:Register`, `Address:Personal`, `Address:Form`) null-coalesce it in `#[PostMount]` when the prop is omitted. `Checkout:Register` and the account register page also pass it explicitly.

## Privacy:Note

Anonymous UX. Replaces core `privacy-notice.html.twig` on theme-owned register. No `data-component`. CMS contact/newsletter keep the core include.

| Prop | Default | Notes |
|------|---------|--------|
| `title` | `general.privacyTitle` | Omit when empty |
| `snippet` | `general.privacyNoticeTextModal` | `%privacyModalTagOpen%` / `%tosModalTagOpen%` wrap `<a data-ajax-modal>` |
| `privacyUrl` / `tosUrl` | CMS pages from `core.basicInformation.*` | |
| `requireCheckbox` | `core.loginRegistration.requireDataProtectionCheckbox == 1` | Native checkbox `acceptedDataProtection` + `required` (not `Form:Switch`) |
| `id` / `name` | `acceptedDataProtection` | RegisterRoute `NotBlank` when required |
| `formViolations` | ambient | Path `/acceptedDataProtection` |

Links use CVA `link` (`fw-semibold text-body`), same ajax-modal pattern as `Product:Price:Tax`. Required-fields hint stays on `Account:Register` footer.

## Address fields

`Address:Personal` (class) + `Address:PersonalCompany` (class) + `Address:Form` (class) + `Address:CountryState` JS. Email/password fields are `Account:Register:Credentials` (email always visible; password gated when `guestSelectable`).

Fields sit in `Grid` `columns="6"`. Spans live in each slot CVA `base` (`g-col-6` / `g-col-3` / `g-col-2`). No Bootstrap `row` / `col-md-*`. Personal / Form / PersonalCompany field slots (and Personal `prepend` / `append`) use [`{% vi_block %}`](../twig/vi-block.md) so callers can override them inside the Grid. `{% block fields %}` stays a real Personal slot (it wraps Grid).

`Address:CountryState` fetches `frontend.country.country.data`. Country flags live on the PHP `countryFlags` map (`requiredZip`, `requiredState`, `requiredVat`, `displayState`) — not option `data-*`. State host is `[data-country-state-host]`. Field ids (`countrySelectId`, `stateSelectId`, `zipInputId`, `vatInputId`) are resolved on the closest `form` (VAT lives in `Address:PersonalCompany`, not inside the CountryState wrapper).

Guest password, different-shipping, and company visibility use `Form:Toggle` (control + content; `hidden` / `inert` / `fieldset disabled`). Nested toggles `sync()` via instance lookup — no PluginManager / CSS targets.

## Shared SoT bridges

| Bridge | Mount |
|--------|--------|
| `storefront/page/account/register/index.html.twig` | `Account:Login` + `Account:Register` |
| `storefront/page/account/addressbook/create.html.twig` / `edit.html.twig` | `Form:Handler` + Personal + Form |
| `storefront/page/account/addressbook/address-item.html.twig` | `Address:Item` |
| `storefront/page/account/addressbook/address-actions.html.twig` | `Address:ItemActions` |
| `storefront/component/account/login.html.twig` | `Account:Login` |

`Address:EditorCreate` composes Personal + Form + `Form:Handler` (native submit). No `data-form-ajax-submit`. Address-book **page** owner is out of scope.

## Files

`components/Checkout/Register.*` · `components/Checkout/Register/Aside.*` · `components/Page/Header/Minimal.*` · `components/Account/Register.*` · `components/Account/Register/Credentials.*` · `components/Privacy/Note.*` · `components/Address/{Personal,PersonalCompany,Form,CountryState,Item,ItemActions,EditorCreate}.*` · `src/Service/ComponentData.php`

## Related

- [Cart page](cart-page.md)
- [Form input](form-input.md)
- [Account action](account-action.md)
- [Grid](grid.md)
- [JavaScript](../conventions/javascript.md)
