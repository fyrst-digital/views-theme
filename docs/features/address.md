# Address

Formatted address lines and the shipping + billing **pair**. Theme-owned display primitives. Account overview, addressbook listing, and edit-order recap consume these tags — [account pages](account.md).

Do **not** use `Address:Item` or `Address:Manager:Item` for checkout recap cards. Those are listing and picker rows.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Address` | One block per address field, read from the customer or order address entity. No country-format snippet renderer |
| `Address:List` | Shipping + billing pair: Grid, card chrome, hide shipping, equal-id copy, optional action slots |
| `Checkout:Confirm:Addresses` | Class VM for the confirm panel: customer `active*` addresses, country-format lines, `Address:Manager:Action`. Not `Address:List` |
| `Checkout:Success:Addresses` | Class VM adapter: order addresses (6.7 vs 6.8 delivery) → `Address:List`, no change actions |
| `Address:Item` / `ItemActions` | Addressbook **listing** row (badges + edit/delete). Listing page owner is [`Account:Addressbook`](account.md) |
| `Address:Manager:*` | Picker modal — [address manager](address-manager.md) |
| `Address:Editor` / `Account:Form:Personal` / `Address:Form` | Create/edit forms — [address manager](address-manager.md) / [checkout register](checkout-register.md) |

## Composition

```
Address                          (class VM; one block per field)
Address:List
├─ Grid
│    ├─ shipping card → Address or equal text  (+ shippingActions nest)
│    └─ billing card → Address or equal text  (+ billingActions nest)
Checkout:Confirm:Addresses       (class VM; not Address:List)
├─ shipping column → lines + Address:Manager:Action
└─ billing column → lines or equal copy + Address:Manager:Action
Checkout:Success:Addresses       (class VM, root-host)
└─ Address:List             (no action nests)
Address:Item
└─ Address
Address:Manager:Item:Hero   (address in use)
└─ Address:Manager:Item
     └─ Form:Selection (Hero overrides label, description, and trailing)
Address:Manager:Item         (available row)
└─ Form:Selection
```

## Address

Class view-model. `address` is `CustomerAddressEntity|OrderAddressEntity`. `#[PostMount]` copies each field onto its own string. Empty or missing values are `''`. `fullName` is the trimmed first and last name. Salutation, country, and country state prefer the translated label and fall back to the entity name. Nothing is joined into a format row.

`showWarning` is set when `showShippingWarning` is true and the country is missing or `shippingAvailable` is false.

Each field is a `{% block %}` on a `span`. Callers replace one with `<twig:block name="street">`. The default span renders only when the string is non-empty. Block order: `salutation`, `title`, `fullName`, `company`, `department`, `street`, `additionalLine1`, `additionalLine2`, `zipcode`, `city`, `countryState`, `country`, `phone`.

| Prop | Default | Notes |
|------|---------|--------|
| `address` | required | `CustomerAddressEntity` or `OrderAddressEntity` |
| `showShippingWarning` | `false` | When true, `Alert` with `address.countryNoShippingAlert` |
| `cva` | `{}` | Root `vi-address`; one `vi-address__*` slot per field |

## Address:List

Anonymous. Shipping card is omitted when `hideShippingAddress`. When both ids match and shipping is visible, `equalText` goes on the **visually second** card: billing when `shippingFirst` (checkout), shipping when `shippingFirst` is false (account billing-first). The first card always shows the live address.

| Prop | Default | Notes |
|------|---------|--------|
| `billingAddress` / `shippingAddress` | required | |
| `hideShippingAddress` | `false` | |
| `addressesEqual` | billing id === shipping id | Pass to override |
| `shippingFirst` | `true` | DOM stays shipping then billing. `false` → Bootstrap `order-1` / `order-2` so billing paints first |
| `showShippingWarning` | `false` | Shipping card only (confirm passes `true`) |
| `shippingTitle` | `checkout.shippingAddressHeader` | Account: `account.overviewShippingHeader` |
| `billingTitle` | `checkout.billingAddressHeader` | Account: `account.overviewBillingHeader` |
| `equalText` | `checkout.addressEqualText` | Account: `account.overviewAddressEqual` |
| `cva` | `{}` | Root `vi-address-list` |

Nests: `grid`, `shipping`, `billing`, `title`, `body`, `equal`. Blocks: `shipping` / `billing` (whole card), `shippingActions` / `billingActions` (footer; empty by default).

## Adapters

`Checkout:Confirm:Addresses` is a class view-model. `#[PostMount]` resolves customer `activeBillingAddress` / `activeShippingAddress` and `page.hideShippingAddress`, builds the card list, and formats lines through the country address-format snippet renderer. The template puts `Address:Manager:Action` on each column (`tab` shipping/billing, fallback `href` `frontend.account.address.edit.page`). Nests: `shipping`, `billing`, `shippingChange`, `billingChange`. See [checkout confirm](checkout-confirm.md) and [address manager](address-manager.md).

`Order:Addresses` resolves order billing + delivery shipping in `#[PostMount]` (6.7 `order.deliveries.first` vs 6.8 `primaryOrderDelivery`). `Checkout:Success:Addresses` is a shim. No manager. See [checkout success](checkout-success.md) and [account pages](account.md).

## Out of scope

- `Address:Card` — extract later if a standalone titled card is needed

## Files

`components/Address.*` · `components/Address/List.*` · adapters `components/Checkout/Confirm/Addresses.*` · `components/Order/Addresses.*` · `components/Checkout/Success/Addresses.*` (shim → `Order:Addresses`)

## Related

- [Address manager](address-manager.md)
- [Account pages](account.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Checkout register](checkout-register.md)
- [Grid](grid.md)
