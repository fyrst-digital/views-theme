# Footer

Theme-owned page footer. Complete chrome is ESI (`frontend.footer`); checkout and edit-order mount a **Minimal** variant inline — the same split as [`Page:Header:Main`](../conventions/ux-components.md) / [`Page:Header:Minimal`](checkout-success.md).

Content comes from the core `FooterPagelet` (footer category tree, service menu, payment/shipping methods). No `theme.json` footer fields. No newsletter.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| ESI bridge | `storefront/layout/footer.html.twig` → `<footer>` + inner include |
| Inner bridge | `storefront/layout/footer/footer.html.twig` → `Page:Footer:Main` (path plugins such as PayPal extend) |
| `Page:Footer:Main` | Class VM. Complete footer: hotline column, nav columns, logos, bottom |
| `Page:Footer:Minimal` | Class VM. Checkout chrome: revocation CTA + `Bottom` only |
| `Page:Footer:Column` | Headline + body; optional collapse via `collapsible` (default `false`); `collapseUntil` (`sm`–`xxl`, default `md`) |
| `Page:Footer:Column:Hotline` | Root-host of Column; contact + revocation; always-open |
| `Page:Footer:Column:Navigation` | Root-host of Grid; tree loop of N Columns; `collapsible` when a root has children |
| `Page:Footer:Logos` | Payment / shipping media + PayPal installment mount |
| `Page:Footer:Bottom` | Service menu, VAT notice, copyright (`brand` prop → snippet `%brand%`) |
| `Page:Footer:Revocation` | `footer.serviceRevocationRequestTextPage` when config allows |
| `FooterCmsUrlResolver` | Contact / revocation / shipping CMS URLs from service menu or nav `seoUrl`, else `frontend.cms.page.full` |

Do **not** add `storefront/layout/footer/footer-minimal.html.twig`.

Cart page keeps the **full** ESI footer (same as full header).

## Composition

```
layout/footer.html.twig                    (ESI frontend.footer)
└─ footer → layout/footer/footer.html.twig
     └─ Page:Footer:Main
          ├─ Grid (columns=8; layout only)
          │    ├─ Page:Footer:Column:Hotline      root-host of Column
          │    └─ Page:Footer:Column:Navigation   Grid (role=list, columns=8)
          │         └─ Page:Footer:Column × N
          ├─ Page:Footer:Logos
          └─ Page:Footer:Bottom

checkout / edit-order  base_esi_footer     (inline, no ESI)
└─ Page:Footer:Minimal :footer="footer"
     ├─ Page:Footer:Revocation
     └─ Page:Footer:Bottom
```

Hotline Column stays always-open (`collapsible` default `false`). Navigation opts in per root when it has child links: toggle via `aria-expanded` (`Column.js`); columns start collapsed. Collapse applies **below** `collapseUntil` (default `md`); from that breakpoint up content stays open and the caret is `d-{collapseUntil}-none`. Pass `collapsible=false` on Navigation (nest `navigation:collapsible`) to opt all columns out. Override the breakpoint with `navigation:collapseUntil` (`sm` | `md` | `lg` | `xl` | `xxl`).

Main skips the Navigation mount when `footer.navigation.tree` is empty (same as Logos / Bottom `{% if footer %}`). Do not wrap Navigation’s own template in that gate.

Do **not** wrap columns in the generic `Accordion` — the desktop headline can be a category link. Outer Main Grid is layout only (no `role=list`); list semantics live on Navigation’s Grid + Column `role=listitem`.

Main nests: `columns`, `hotline`, `navigation`, `logos`, `bottom`. Navigation nest `column` forwards to each `Page:Footer:Column`. Hotline nest `revocation` forwards to `Page:Footer:Revocation`.

## Class components

`Main` and `Minimal` are [class UX components](../conventions/ux-components.md#class-components-php-backed):

- `Main.php` / `Minimal.php` — `#[PostMount]` reads `FooterCmsUrlResolver::urls()`
- Templates compose only

Must stay registered via the components `**/*.php` service prototype (autowire + autoconfigure).

| Field | Notes |
|-------|--------|
| `footer` | `FooterPagelet` (ESI + checkout controllers already load it) |
| `contactUrl` | Main only — contact CMS page |
| `revocationUrl` | Revocation CMS page |
| `shippingUrl` | Shipping/payment info CMS page (VAT snippet) |
| `showRevocation` | `core.basicInformation.showRevocationButton` and a revocation page id |

## Call sites

| Surface | Mount |
|---------|--------|
| Default storefront | ESI `frontend.footer` → `Page:Footer:Main` |
| Checkout register / confirm / finish | `base_esi_footer` → `Page:Footer:Minimal :footer="footer"` |
| Edit-order | Same Minimal mount |

## PayPal installment banner

Replacing core `layout/footer/footer.html.twig` would skip SwagPayPal’s `layout_footer_payment_logos` override. `Page:Footer:Logos` renders the installment mount when `footer.extensions.payPalInstallmentBannerData.footerEnabled` (string extension id, no PayPal PHP import). Attributes match PayPal’s JS: `data-swag-paypal-installment-banner` + `data-swag-pay-pal-installment-banner-options`.

## Snippets

Reuse core `footer.*` keys for shop content. No Shopware copyright icon. Copyright is theme-owned: `viewsTheme.copyright` with `%brand%` from Bottom’s `brand` prop (default fyrst.dev `<a>`). Override via `:brand` on Bottom or Main/Minimal nest `bottom:brand`.

| Key | Where |
|-----|--------|
| `footer.serviceHotlineHeadline` / `footer.serviceHotline` | Hotline column |
| `footer.serviceContactTextPage` | Contact CMS link (`%url%`) |
| `footer.serviceRevocationRequestTextPage` | Revocation CTA (`%url%`) |
| `footer.includeVatTextPage` / `footer.excludeVatTextPage` | VAT (`%url%`, `%star%`) |
| `viewsTheme.copyright` | Bottom (`%brand%` = `brand` prop) |

## Scripts

| Component | Role |
|-----------|------|
| `Page:Footer:Column` | Only when `collapsible` is true: `data-component` + click `button[aria-expanded]` → toggle `aria-expanded`. Shell `__content` owns `block-size` + `[aria-expanded]`; from `collapseUntil` up (`data-collapse-until` + `@variant collapse-until` in `components.css`) always open; inner `__body` holds padding — same split as Accordion:Panel |

Main / Minimal / Bottom / Logos / Column:Hotline have **no** `data-component`. Navigation Columns do when they have children.

## Out of scope

- Newsletter signup in the footer
- Theme config fields for footer
- Redesigning edit-order back-link (Header:Minimal still goes home)

## Files

`components/Page/Footer/{Main,Minimal,Column,Bottom,Logos,Revocation}.*` · `components/Page/Footer/Column/{Hotline,Navigation}.*` · `app/storefront/src/css/components.css` (`@custom-variant collapse-until` token assigns) · `src/Service/FooterCmsUrlResolver.php` · `storefront/layout/footer.html.twig` · `storefront/layout/footer/footer.html.twig` · checkout `address` / `confirm` / `finish` + `account/order` bridges

## Related

- [Grid](grid.md)
- [Checkout register](checkout-register.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Account pages](account.md)
- [Architecture](../architecture.md)
- [JavaScript](../conventions/javascript.md)
