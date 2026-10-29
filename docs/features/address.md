# Address

Formatted address lines and the shipping + billing **pair**. Theme-owned display primitives. Account overview, addressbook listing, and edit-order recap consume these tags — [account pages](account.md).

Do **not** use `Address:Item` or `Address:Manager:Item` for checkout recap cards. Those are listing and picker rows.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Address` | One block per address field, read from the customer or order address entity. No country-format snippet renderer |
| `Address:List` | Shipping + billing pair: Grid, card chrome, hide shipping, equal-id copy, optional action slots |
| `Checkout:Addresses` | Class VM for the confirm and success sections: customer `active*` addresses (or, read-only, the addresses it is given) mounted as `Address`, section title `checkout.confirmAddresses`, `Address:Manager:Action` unless `readOnly`. Not `Address:List` |
| `Checkout:Success:Addresses` | Class VM, extends `Order:Addresses`: order addresses (6.7 vs 6.8 delivery) → read-only `Checkout:Addresses`, no change actions |
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
Checkout:Addresses               (class VM; not Address:List)
├─ h2 checkout.confirmAddresses
└─ panel
     ├─ shipping column → Address + Address:Manager:Action
     └─ billing column → Address (or equal copy in content) + Address:Manager:Action
Checkout:Success:Addresses       (class VM, extends Order:Addresses)
└─ Checkout:Addresses       (readOnly; order addresses; no Address:Manager:Action)
Address:Item
└─ Address
Address:Manager:Item:Hero   (address in use)
└─ Address:Manager:Item
     └─ Form:Selection (Hero overrides label, description, and trailing)
Address:Manager:Item         (available row)
└─ Form:Selection
```

## Address

Class view-model. `address` is `CustomerAddressEntity|OrderAddressEntity`. `#[PostMount]` copies each field onto its own string. Empty or missing values are `''`. `fullName` is the salutation display name, then the trimmed first and last name. A salutation key of `not_specified` is left off. Salutation, country, and country state prefer the translated label and fall back to the entity name. The academic title stays its own line. Nothing else is joined into a format row.

`showWarning` is set when `showShippingWarning` is true and the country is missing or `shippingAvailable` is false.

Each field is a `{% block %}` on a `span`. Callers replace one with `<twig:block name="street">`. The default span renders only when the string is non-empty. Block order: `title`, `fullName`, `company`, `department`, `street`, `additionalLine1`, `additionalLine2`, `zipcode`, `city`, `countryState`, `country`, `phone`. Salutation is not its own block.

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

`Checkout:Addresses` is a class view-model. `#[PostMount]` resolves customer `activeBillingAddress` / `activeShippingAddress` and `page.hideShippingAddress`, and builds the card list. Each card keeps the customer address entity. The template owns the section and the `checkout.confirmAddresses` title, mounts `Address` for the lines (`fullName`, including the salutation, as the name style; other fields as the body style), and puts `Address:Manager:Action` on each column (`tab` shipping/billing, fallback `href` `frontend.account.address.edit.page`). When billing matches shipping, that column passes no address and overrides `Address`’s `content` with the equal copy. Nests: `title`, `panel`, `shipping`, `billing`, `shippingChange`, `billingChange`. See [checkout confirm](checkout-confirm.md) and [address manager](address-manager.md).

`Checkout:Addresses` takes `readOnly`. Then it does not fall back to the customer’s addresses, omits `Address:Manager:Action`, and never shows the shipping warning. It accepts customer or order address entities.

`Order:Addresses` resolves order billing + delivery shipping in `#[PostMount]` (6.7 `order.deliveries.first` vs 6.8 `primaryOrderDelivery`) and renders `Address:List` (account pages). `Checkout:Success:Addresses` extends it and renders the read-only `Checkout:Addresses` panel instead. No manager. See [checkout success](checkout-success.md) and [account pages](account.md).

## Out of scope

- `Address:Card` — extract later if a standalone titled card is needed

## Files

`components/Address.*` · `components/Address/List.*` · adapters `components/Checkout/Addresses.*` · `components/Order/Addresses.*` · `components/Checkout/Success/Addresses.*` (extends `Order:Addresses`, renders `Checkout:Addresses`)

## Related

- [Address manager](address-manager.md)
- [Account pages](account.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Checkout register](checkout-register.md)
- [Grid](grid.md)
