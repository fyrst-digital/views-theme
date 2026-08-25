# Address

Formatted address lines and the shipping + billing **pair**. Theme-owned display primitives. Account overview, addressbook listing, and edit-order recap consume these tags — [account pages](account.md).

Do **not** use `Address:Item` or `Address:Manager:Item` for checkout recap cards. Those are listing and picker rows.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Address` | Formatted lines. Wraps core `address.html.twig` so plugin overrides of that include still apply |
| `Address:List` | Shipping + billing pair: Grid, card chrome, hide shipping, equal-id copy, optional action slots |
| `Checkout:Confirm:Addresses` | Adapter: customer `active*` addresses + `Address:Manager:Action` in the action slots |
| `Checkout:Success:Addresses` | Class VM adapter: order addresses (6.7 vs 6.8 delivery) → `Address:List`, no change actions |
| `Address:Item` / `ItemActions` | Addressbook **listing** row (badges + edit/delete). Listing page owner is [`Account:Addressbook`](account.md) |
| `Address:Manager:*` | Picker modal — [address manager](address-manager.md) |
| `Address:Editor` / `Personal` / `Form` | Create/edit forms — [address manager](address-manager.md) / [checkout register](checkout-register.md) |

## Composition

```
Address                          (core address.html.twig)
Address:List
├─ Grid
│    ├─ shipping card → Address  (+ shippingActions nest)
│    └─ billing card → Address or equal text  (+ billingActions nest)
Checkout:Confirm:Addresses       (root-host)
└─ Address:List
     ├─ shippingActions → Address:Manager:Action
     └─ billingActions → Address:Manager:Action
Checkout:Success:Addresses       (class VM, root-host)
└─ Address:List             (no action nests)
Address:Item / Address:Manager:Item
└─ Address
```

## Address

Anonymous. Props:

| Prop | Default | Notes |
|------|---------|--------|
| `address` | required | Customer or order address entity |
| `showShippingWarning` | `false` | Forwards to the core include (`address.countryNoShippingAlert`) |
| `cva` | `{}` | Root `vi-address` |

## Address:List

Anonymous. Shipping card is omitted when `hideShippingAddress`. Billing shows `equalText` when both ids match **and** shipping is visible.

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

`Checkout:Confirm:Addresses` keeps customer defaults (`activeBillingAddress` / `activeShippingAddress`, `page.hideShippingAddress`) and fills the action slots with `Address:Manager:Action` (`tab` shipping/billing, fallback `href` `frontend.account.address.edit.page`). Nests: `shippingChange`, `billingChange`. See [checkout confirm](checkout-confirm.md) and [address manager](address-manager.md).

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
