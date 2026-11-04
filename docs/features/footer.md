# Footer

Theme-owned page footer. Complete chrome is ESI (`frontend.footer`); checkout and edit-order mount a **Minimal** variant inline — the same split as [`Page:Header:Main`](../conventions/ux-components.md) / [`Page:Header:Minimal`](checkout-success.md).

Content comes from the core `FooterPagelet` (footer category tree, service menu, payment/shipping methods). No `theme.json` footer fields. No newsletter block. Public subscribe is [`Newsletter:Form`](newsletter.md), not mounted here.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| ESI bridge | `storefront/layout/footer.html.twig` → `<footer class="footer-main">` + inner include |
| Inner bridge | `storefront/layout/footer/footer.html.twig` → `Page:Footer` |
| `Page:Footer` | Class VM. Complete footer: company, nav, logos, bottom; owns `paymentLogos` / `shippingLogos` |
| `Page:Footer:Main` | Anonymous. Root div (`vi-footer-main-wrapper py-8`) → `{% block content %}` → inner `container` div (slot `wrapper`, `vi-footer-main__container container`) → `columns` block → Grid with `Column:Company` + `Column:Navigation`. Props `footer`, `contactUrl`, `revocationUrl`, `showRevocation` come from Footer. Blocks: `content`, `columns`; `{% vi_block %}` `company` / `navigation` into the Grid. Nests: `wrapper`, `columns`, `company`, `navigation`, `column` (forwarded to each Column) |
| `Page:Footer:Minimal` | Class VM. Checkout chrome: shop copyright, `Services`, then `Bottom` (VAT + theme credit). No revocation CTA |
| `Page:Footer:Bottom` | VAT notice and theme credit; empty `prepend` block (Footer fills with `Services`) (`brand` prop → snippet `%brand%`). Mounted by Footer and Minimal |
| `Page:Footer:Column` | Headline + body; `g-col-1` on the footer grid. Optional collapse via `collapsible` (default `false`); `collapseUntil` (`sm`–`xxl`, default `md`) |
| `Page:Footer:Column:Company` | Root-host of Column; headline is the theme logo ([`Page:Logo`](logo.md), width `--vi-footer-company-logo-w`, default `120px`); contact block built from shop backend data (see [Contact data](#contact-data)) + revocation; always-open; `g-col-lg-3` (with Column’s `g-col-1`) |
| `Page:Footer:Column:Navigation` | Own grid `div` (`role=list`, `d-grid`, `g-col-1 g-col-md-6`; `Column/Navigation.css` sets `grid-template-columns: repeat(auto-fit, min(100%, var(--vi-footer-navigation-basis, 100%)))`, fixed-width tracks pushed to the end with `justify-content-md-end`; `_theme.scss` assigns `--vi-footer-navigation-basis: 200px` from `md`); tree loop of N Columns; `collapsible` when a root has children. Root headline links (size `md`, `fw-semibold`) and child links (size `sm`) are `Button` (`type: link`, `link: true`, `color: dark`); folders stay plain text. Nests: `headlineLink`, `link` |
| `Page:Footer:Column:Logos` | Root is the wrapper band (`vi-footer__logos-wrapper py-6 border-bottom`, carries `data-component-*` and caller `class`); inside it the `list` slot is the flex host (`role=list`, `d-flex flex-wrap gap-4 container`; the inner logo `items` rows are flex too) mounted by Footer **above** the main content (Footer slot `logos`: `vi-footer__logos`, lands on the wrapper root), not a Grid cell; payment + shipping Columns, headline (`title` slot via `title:class`) is `fs-6`; each Column's root `base` is replaced through `cva` (`column` slot) so its headline-to-logos gap is `gap-2` instead of Column's `gap-4`, and the Column is `flex-md-row` from `md` (headline beside the logos). Blocks: `content` (directly under the root, wraps the `list`), `prepend` / `append` (plain list HTML), `payment` / `shipping` (whole Column), and `{% vi_block %}` slots forwarded into each Column host: `paymentHeadline`, `paymentContent`, `shippingHeadline`, `shippingContent` |
| `Page:Footer:Services` | Service-menu list. Renders nothing when `serviceMenu` is empty. Each link is `Button` (`type: link`, `link: true`, `color: dark`, `size: sm`). Callers add list chrome (`gap-6` on Minimal, `justify-content-center gap-3` on Footer) |
| `Page:Footer:Revocation` | `footer.serviceRevocationRequestTextPage`. `Page:Footer:Column:Company` mounts it only when `showRevocation` |
| `FooterCmsUrlResolver` | Contact / revocation / shipping CMS URLs from service menu or nav `seoUrl`, else `frontend.cms.page.full` |

Footer’s ground and top rule are CVA utilities on the root (`bg-light border-top`); there is no `Footer.css`.

Do **not** add `storefront/layout/footer/footer-minimal.html.twig`.

Cart page keeps the **full** ESI footer (same as full header).

## Composition

```
layout/footer.html.twig                    (ESI frontend.footer)
└─ footer → layout/footer/footer.html.twig
     └─ Page:Footer
          ├─ Page:Footer:Column:Logos            only if a logo list is non-empty; root is the wrapper `vi-footer__logos-wrapper` (`py-6 border-bottom`) around the `container` + flex `list` (role=list)
          │    ├─ Page:Footer:Column             payment (if paymentLogos)
          │    └─ Page:Footer:Column             shipping (if shippingLogos)
          ├─ Page:Footer:Main                    root div `vi-footer-main-wrapper` (Footer adds `vi-footer-main`, slot `main`) → inner `container` div → Grid (content lives in Main itself)
          │    └─ Grid (columns=1-lg:8; gap=false / --vi-grid-gap)
          │         ├─ Page:Footer:Column:Company      root-host of Column; g-col-1 + g-col-lg-3
          │         └─ Page:Footer:Column:Navigation   g-col-1 g-col-md-6 grid (role=list, d-grid gap-md-6 justify-content-md-end, auto-fit fixed columns)
          │              └─ Page:Footer:Column × N
          └─ Page:Footer:Bottom (root classes replaced via `cva.root.base`)
               ├─ `prepend` block: Page:Footer:Services (`justify-content-center gap-3`)
               ├─ VAT notice
               └─ theme credit (`viewsTheme.copyright`, `%brand%`)

checkout / edit-order  base_esi_footer     (inline, no ESI)
└─ Page:Footer:Minimal :footer="footer"
     └─ .container
          ├─ row
          │    ├─ shop copyright (`viewsTheme.shopCopyright`, `%year%` `%shop%`)
          │    └─ Page:Footer:Services (`gap-6`)
          └─ Page:Footer:Bottom (`shippingUrl`, `brand`; full-width, not centered)
               ├─ VAT notice (`footer.includeVatTextPage` / `excludeVatTextPage`)
               └─ theme credit (`viewsTheme.copyright`, `%brand%`)
```

Minimal matches the checkout pen footer, with the shop name in place of the pen’s sample brand and real service-menu labels. Ivory ground (`bg-light`), linen top rule (`border-top`). Below `xl`: shop copyright, then the service links, then the VAT line, then the theme credit; vertical padding `18px` / `22px`; link gap `24px` (`gap-6`); stack gap `12px` (`gap-3`). From `xl`: the row is one line, shop copyright at the start and service links at the end (`justify-content-xl-between`), VAT on the next full-width line, theme credit on the line after that; vertical padding `22px`. The bar is full-bleed. Horizontal inset is Minimal’s `.container`, the same inset as the minimal header. Service links are `Page:Footer:Services` in both footers: `Button` (`type: link`, `link: true`, `color: dark`, `size: sm`). Minimal passes `gap-6`; Footer passes `justify-content-center gap-3`. `Page:Footer:Bottom` is the VAT notice and the theme credit, mounted by Footer and Minimal. Its empty `prepend` block sits before the VAT line; Footer puts `Services` there, so Footer’s bottom bar is Bottom itself, not a plain wrapper `div`. Minimal forwards `:brand`. `Page:Footer:Revocation` is not mounted on Minimal. Register, confirm, finish, and edit-order share this footer, so they all drop that CTA and keep the service links. Revocation stays on the confirm summary agreements and on the full footer’s company column.

Company Column stays always-open (`collapsible` default `false`). Navigation opts in per root when it has child links: toggle via `aria-expanded` (`Column.js`); columns start collapsed. Collapse applies **below** `collapseUntil` (default `md`); from that breakpoint up content stays open, the caret is `d-{collapseUntil}-none`, and `inert` stays off even if `aria-expanded` is false. Pass `collapsible=false` on Navigation (nest `navigation:collapsible`) to opt all columns out. Override the breakpoint with `navigation:collapseUntil` (`sm` | `md` | `lg` | `xl` | `xxl`). Logos Columns stay always-open.

Footer skips the Navigation mount when `footer.navigation.tree` is empty. Skip `Column:Logos` when both `paymentLogos` and `shippingLogos` are empty. Bottom still `{% if footer %}`. Do not wrap Navigation’s or Logos’ own templates in those gates. Logos still mounts a Column only when that list is non-empty.

Do **not** wrap columns in the generic `Accordion` — the desktop headline can be a category link. Outer Footer Grid has no `role=list`; list semantics live on Navigation’s grid root and Logos’ flex list + their Column `role=listitem` (hosts pass it; Column does not default it).

Footer nests: `main` (use `main:company:…`, `main:navigation:…`, `main:columns:…` to reach inside), `logos`, `bottom` (forwards to `Page:Footer:Bottom`), `services`. Main’s `column` nest and Logos’ `column` nest forward to each `Page:Footer:Column`. Company nest `revocation` forwards to `Page:Footer:Revocation`. Logos sit above the Main content; `Page:Footer:Column:Logos` root is the wrapper band and its `list` slot is the `container` grid row. Column contributes `g-col-1`; Company adds `g-col-lg-3`.

## Class components

`Footer` and `Minimal` are [class UX components](../conventions/ux-components.md#class-components-php-backed):

- `Footer.php` — `#[PostMount]` reads `FooterCmsUrlResolver::urls()` (contact, revocation, shipping) and builds `paymentLogos` / `shippingLogos` (methods with media; `{ media, alt, title }`)
- `Minimal.php` — `#[PostMount]` reads `shippingUrl` for Bottom’s VAT notice. `brand` is forwarded to Bottom
- Templates compose only. `Column:Logos` is anonymous and always renders when mounted (inner Columns only when that list is non-empty).

Must stay registered via the components `**/*.php` service prototype (autowire + autoconfigure).

| Field | Notes |
|-------|--------|
| `footer` | `FooterPagelet` (ESI + checkout controllers already load it) |
| `contactUrl` | Footer only — contact CMS page |
| `revocationUrl` | Footer only — revocation CMS page (company). Minimal does not mount `Page:Footer:Revocation` |
| `shippingUrl` | Shipping/payment info CMS page (VAT snippet). Passed into Bottom |
| `brand` | Theme-credit link (`%brand%`). Minimal forwards it to Bottom; Bottom’s own default is the same fyrst.dev `<a>` |
| `showRevocation` | Footer only — `core.basicInformation.showRevocationButton` and a revocation page id |
| `paymentLogos` | Footer only — payment methods with media (`media`, `alt`, `title`) |
| `shippingLogos` | Footer only — shipping methods with media (`media`, `alt`, `title`) |

## Call sites

| Surface | Mount |
|---------|--------|
| Default storefront | ESI `frontend.footer` → `Page:Footer` |
| Checkout register / confirm / finish | `base_esi_footer` → `Page:Footer:Minimal :footer="footer"` |
| Edit-order | Same Minimal mount |

## Contact data

`Page:Footer:Column:Company` renders the theme logo as its headline and a contact block from the plugin config card **Shop information** ([Configuration](../configuration.md#shop-information)). It reads only two things from `core.basicInformation.*`: the shop name and the CMS page links (contact page, via the resolver) and does not use the core `footer.serviceCompany` / `footer.serviceContactTextPage` snippets. Every field is optional and renders nothing when empty:

| Output | Config |
|--------|--------|
| Address block (`<address>`) | core `shopName` (bold; else sales channel name), then `shopInfoStreet`, `shopInfoZipcode` + `shopInfoCity` |
| Phone (`tel:` link) | `shopInfoPhone` (spaces, `-`, `/`, `()` stripped from the `href`) |
| Email (`mailto:` link) | `shopInfoEmail` |
| Contact form link | core `contactPage` → `contactUrl`, label `viewsTheme.footer.contactForm` |

Links are `Button` (`type: link`, `link: true`, `color: dark`, `size: sm`) with Phosphor icons: `phone`, `envelope-simple`, `chat-circle-text` (contact form); the address block has no icon. The icons are listed in `build.icons.mts` (`default` + `bold` packs) and need `npm run build:icons`.

## Snippets

Reuse core `footer.*` keys for shop content. No Shopware copyright icon. Minimal shows the shop claim `viewsTheme.shopCopyright` (`%year%`, `%shop%` from `core.basicInformation.shopName`, else the sales channel name). The theme credit `viewsTheme.copyright` is `Page:Footer:Bottom` in both footers (`%brand%` from `brand`, default fyrst.dev `<a>`). Minimal forwards `:brand` into Bottom.

| Key | Where |
|-----|--------|
| `viewsTheme.footer.contactForm` | Contact-form link label (`href` = `contactUrl`) |
| `footer.serviceRevocationRequestTextPage` | Company revocation CTA (`%url%`). Not the minimal footer |
| `footer.includeVatTextPage` / `footer.excludeVatTextPage` | VAT (`%url%`, `%star%`) |
| `checkout.paymentMethod` / `checkout.shippingMethod` | Logos Column headlines |
| `viewsTheme.shopCopyright` | Minimal shop claim (`%year%`, `%shop%`) |
| `viewsTheme.copyright` | Bottom theme credit (`%brand%` = `brand`). Minimal forwards `:brand` |

## Scripts

| Component | Role |
|-----------|------|
| `Page:Footer:Column` | Only when `collapsible` is true: `data-component` + click `button[aria-expanded]` → toggle `aria-expanded` and `__content.inert`. SoT is ARIA + `inert` (no Twig `inert` — desktop CSS forces open while `aria-expanded` stays false). Shell `__content` owns `display` (`none` while collapsed, so the root’s `gap` adds no space; `transition … allow-discrete` + `@starting-style` keep the animation), `block-size` + `[aria-expanded]`; from `collapseUntil` up (`data-collapse-until` + `vi-collapse-until` in `scss/_theme.scss`) always open and `inert` off. `matchMedia` uses `window.breakpoints[collapseUntil]` (px); optional `data-component-options` `{ breakpoints: { md: 900 } }` overlays that map. Inner `__body` holds padding — same split as Accordion:Panel |

Footer / Minimal / Bottom / Services / Column:Logos / Column:Company have **no** `data-component`. Navigation Columns do when they have children.

## Out of scope

- Newsletter signup in the footer
- Theme config fields for footer
- Redesigning edit-order back-link (Header:Minimal still goes home)
- PayPal installment / Pay Later footer banner (SwagPayPal’s `layout_footer_payment_logos` override is skipped; Column:Logos does not re-mount it)

## Files

`components/Page/Footer/{Footer,Minimal,Column,Bottom,Services,Revocation}.*` · `components/Page/Footer/Column/{Company,Navigation,Logos}.*` · `app/storefront/src/scss/_theme.scss` (`vi-collapse-until` token assigns) · `src/Service/FooterCmsUrlResolver.php` · `storefront/layout/footer.html.twig` · `storefront/layout/footer/footer.html.twig` · checkout `address` / `confirm` / `finish` + `account/order` bridges

## Related

- [Logo](logo.md)
- [Grid](grid.md)
- [Checkout register](checkout-register.md)
- [Checkout confirm](checkout-confirm.md)
- [Checkout success](checkout-success.md)
- [Account pages](account.md)
- [Architecture](../architecture.md)
- [JavaScript](../conventions/javascript.md)
