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
| `Page:Footer:Column` | Headline + body; mobile toggle via `aria-expanded` (`Column.js`) |
| `Page:Footer:Column:Navigation` | Root-host of Column; category headline + child links |
| `Page:Footer:Logos` | Payment / shipping media + PayPal installment mount |
| `Page:Footer:Bottom` | Service menu, VAT notice, copyright |
| `Page:Footer:Revocation` | `footer.serviceRevocationRequestTextPage` when config allows |
| `FooterCmsUrlResolver` | Contact / revocation / shipping CMS URLs from service menu or nav `seoUrl`, else `frontend.cms.page.full` |

Do **not** add `storefront/layout/footer/footer-minimal.html.twig`.

Cart page keeps the **full** ESI footer (same as full header).

## Composition

```
layout/footer.html.twig                    (ESI frontend.footer)
└─ footer → layout/footer/footer.html.twig
     └─ Page:Footer:Main
          ├─ Grid (role=list)
          │    ├─ Page:Footer:Column          hotline / contact / revocation
          │    └─ Page:Footer:Column:Navigation × N
          ├─ Page:Footer:Logos
          └─ Page:Footer:Bottom

checkout / edit-order  base_esi_footer     (inline, no ESI)
└─ Page:Footer:Minimal :footer="footer"
     ├─ Page:Footer:Revocation
     └─ Page:Footer:Bottom
```

Desktop (`md` / 768px): columns always open, toggle hidden (`d-md-none`). Mobile: columns start collapsed; `Column.js` flips `aria-expanded` only (no `classList`, no Bootstrap collapse plugin). Do **not** wrap columns in `Accordion` — the desktop headline can be a category link.

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

Reuse core `footer.*` keys. No new snippets. No Shopware copyright icon.

| Key | Where |
|-----|--------|
| `footer.serviceHotlineHeadline` / `footer.serviceHotline` | Hotline column |
| `footer.serviceContactTextPage` | Contact CMS link (`%url%`) |
| `footer.serviceRevocationRequestTextPage` | Revocation CTA (`%url%`) |
| `footer.includeVatTextPage` / `footer.excludeVatTextPage` | VAT (`%url%`, `%star%`) |
| `footer.copyrightInfo` | Bottom |

## Scripts

| Component | Role |
|-----------|------|
| `Page:Footer:Column` | Click `button[aria-expanded]` → toggle `aria-expanded`. Content visibility is CSS (`block-size` + `[aria-expanded]`; `md+` always open) |

Main / Minimal / Bottom / Logos have **no** `data-component`.

## Out of scope

- Newsletter signup in the footer
- Theme config fields for footer
- Redesigning edit-order back-link (Header:Minimal still goes home)

## Files

`components/Page/Footer/{Main,Minimal,Column,Bottom,Logos,Revocation}.*` · `components/Page/Footer/Column/Navigation.*` · `src/Service/FooterCmsUrlResolver.php` · `storefront/layout/footer.html.twig` · `storefront/layout/footer/footer.html.twig` · checkout `address` / `confirm` / `finish` + `account/order` bridges

## Related

- [Grid](grid.md)
- [Checkout register](checkout-register.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Account pages](account.md)
- [Architecture](../architecture.md)
- [JavaScript](../conventions/javascript.md)
