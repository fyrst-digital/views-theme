# Logo

Shop mark for header, checkout chrome, and the footer company column. Single source: theme field **`page-logo`**. When that field is empty, `Page:Logo` always renders the bundled Views logo. Inherited Storefront `sw-logo-desktop` / `sw-logo-tablet` / `sw-logo-mobile` are never used for this image.

This is a behaviour change: shops that relied on the Storefront `sw-logo-*` media fields for the storefront logo must set `page-logo` on the theme **Media** tab.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Page:Logo` | Class VM. `#[PostMount]` sets `logoPath`. Twig composes the link + `<picture>` + `img.vi-logo__image` |
| Theme field `page-logo` | Media tab (`theme.json`). Empty default. `custom.css: true` → `--page-logo`. `fullWidth: true` |
| Bundled asset | `src/Resources/public/img/views-logo.svg` (`bundles/viewstheme/img/views-logo.svg`) |
| Width | `logo-width-*` on `Page:Header:Main` only — see [Configuration](../configuration.md#theme-fields-admin) |

Must stay registered via the components `**/*.php` service prototype (autowire + autoconfigure).

## Resolution

`Page:Logo` picks the image in this order and stops at the first non-empty value:

1. Explicit `logoPath` prop (call-site override)
2. Theme `page-logo`
3. Bundled Views logo

`tabletLogoPath` / `mobileLogoPath` are only used when a caller passes them as props. They are not read from theme config. Default mounts therefore render one `<img>` for every breakpoint.

## Call sites

All default mounts are `<twig:ViewsTheme:Page:Logo />` with no path props:

| Surface | Mount |
|---------|--------|
| Storefront header | `Page:Header:Main` ([navigation bar](navigation-bar.md)) |
| Checkout / account chrome | `Page:Header:Minimal` ([checkout confirm](checkout-confirm.md), [checkout register](checkout-register.md), [checkout success](checkout-success.md), [account](account.md)) |
| Footer company headline | `Page:Footer:Column:Company` ([footer](footer.md)) |

## Out of scope

Favicon, share image, and Open Graph / Twitter / JSON-LD logos stay on the inherited Storefront fields. ViewsTheme’s `storefront/layout/meta.html.twig` does not override those core blocks:

| Field | Where |
|-------|--------|
| `sw-logo-favicon` | Core `layout/meta.html.twig` `<link rel="icon">` |
| `sw-logo-share` | Core apple-touch-icon when set |
| `sw-logo-desktop` | Core Open Graph / Twitter / JSON-LD organisation image |

## Files

`components/Page/Logo.*` · `public/img/views-logo.svg` · `theme.json` (`page-logo`, `logo-width-*`) · `storefront/layout/meta.html.twig` (header logo width only)

## Related

- [Configuration](../configuration.md#theme-fields-admin)
- [Navigation bar](navigation-bar.md)
- [Footer](footer.md)
- [Checkout confirm](checkout-confirm.md)
