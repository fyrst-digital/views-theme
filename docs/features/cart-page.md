# Cart page

Theme-owned checkout cart page. Replaces core Bootstrap cart chrome with UX components. Mutations stay on always-mounted `Cart`; the page refreshes islands on `Cart:Changed` (no full reload).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/page/checkout/cart/index.html.twig` → `page_checkout` → `Cart:Page` |
| `Cart:Page` | Owner JS: listen `Cart:Changed`, fetch `/vi/cart/page`, swap islands |
| `Cart:Flashes` | Session flash bag (`app.flashes`) via `Alert`; shared with drawer |
| `Cart:Heading` | Title + inline count (`h1`); island |
| `Cart:Items` | One CSS grid (`layout="grid"`) or stacked flex; `Cart:Empty` when empty; shared with drawer |
| `Cart:Page:Aside` | Summary + `Cart:Options` + checkout CTA — **omitted** when empty |
| `Cart:Summary` | Full totals (subtotal, shipping, grand total, net, tax) |
| `Cart:Options` | Shipping pre-calc + promotion form |
| `Cart:Actions` | Checkout only (`cart` nest emptied) |
| `LineItem` | `layout="grid"` → qty · remove · unit · total columns (desktop) |
| `Cart` | HTTP owner (header); page does **not** reload |

## Composition

```
Cart:Page (data-component owner)
├─ Cart:Flashes
├─ Cart:Heading (h1, countDisplay=inline)
├─ [role=alert] (client error)
└─ body (`data-cart-page-body`)
      ├─ Cart:Items layout="grid"  (d-grid; no list wrapper)
      │    ├─ header d-none d-xl-contents (aria-hidden)
      │    └─ LineItem layout="grid" d-contents × N  |  Cart:Empty
      └─ Cart:Page:Aside (when not empty; position-xl-sticky)
          ├─ Cart:Summary
          ├─ Cart:Options
          └─ Cart:Actions (no cart-page link)
```

Desktop (`xl` / 1260px+): items + sticky aside. Mobile: stack.

## LineItem `layout`

| Value | Used by | Host |
|-------|---------|------|
| `stacked` (default) | Drawer `Cart:Items` | Cover + info / footer areas |
| `grid` | Cart page `Cart:Items` | Desktop (`xl`): one grid; header + `LineItem` + footer `d-contents`. Cells: cover · info · qty · remove · unit · total. Mobile: cover · info, then footer flex row (qty · remove · total; unit `d-none d-xl-block`) |

`layout` is forwarded `Cart:Items` → `LineItem` → Product / Promotion / Container / Generic. Cart:Items passes `tag="div"` (no `<ul>` / `<li>`).

`LineItem:UnitPrice` is **grid-only** (`lineItem.price.unitPrice`; skips delivery-discount scope). Shown from `xl`. Footer cell order: qty → remove → unit → total.

## Controller

| Route name | Path | Method | Renders |
|------------|------|--------|---------|
| `frontend.views-theme.cart.page` | `/vi/cart/page` | `GET` (XHR) | `ViewsTheme:Cart:Page` |

| Piece | Detail |
|-------|--------|
| Loader | `CheckoutCartPageLoader` — same DTO as the storefront cart page |
| App hook | `CheckoutCartPageLoadedHook` (`checkout-cart-page-loaded`) after load, before render |
| Render | `AbstractComponentController::renderComponent()` → `ViewsTheme:Cart:Page` with prop `page` |

Used for in-page island refresh. Same data/hooks as [cart drawer](cart-drawer.md).

## Owner JS (`Cart:Page.js`)

On `ViewsTheme:Cart:Changed`:

- `ok === false` → show `[role=alert]`
- `ok` → fetch `pageUrl` and swap by `data-component` identity (scoped to the page root / body)

| Island | Root |
|--------|------|
| `ViewsTheme:Cart:Flashes` | Page |
| `ViewsTheme:Cart:Heading` | Page |
| `ViewsTheme:Cart:Items` | Page |
| `ViewsTheme:Cart:Page:Aside` | `[data-cart-page-body]` (remove when missing, append when newly present) |

Busy/queue/abort + island swap match drawer Body (`parseHtmlFragment` + `data-component` identity). Swap stays scoped so drawer + page can both be open.

## Hooks

| Component | Attribute |
|-----------|-----------|
| Page owner | `data-component="ViewsTheme:Cart:Page"` |
| Flashes / Heading / Items | `data-component="ViewsTheme:Cart:…"` |
| Aside | `data-component="ViewsTheme:Cart:Page:Aside"` |

Page options (`data-component-options`): `pageUrl`.

## Out of scope

- Add-by-number / `Cart:AddProductForm`
- Confirm / finish redesign
- Wishlist on line items
- PayPal express / installment (core/PayPal inner blocks are not preserved)
- Hidden GA line-item dump

## Key source files

| Area | Path |
|------|------|
| Controller | `src/Controller/CartPageController.php` |
| Page | `src/Resources/views/components/Cart/Page.*` |
| Aside | `src/Resources/views/components/Cart/Page/Aside.*` |
| Shared islands | `src/Resources/views/components/Cart/{Flashes,Items,Heading}.*` |
| Bridge | `src/Resources/views/storefront/page/checkout/cart/index.html.twig` |

## Related

- [Cart drawer](cart-drawer.md)
- [Architecture — UX XHR](../architecture.md#ux-xhr-component-responses-critical)
