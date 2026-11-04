# Configuration

ViewsTheme has two configuration surfaces: **plugin config** (system config) and **theme config** (`theme.json`).

## Plugin configuration

Defined in `src/Resources/config/config.xml` (the schema and defaults). Editable in the Shopware administration under **Settings → Extensions → Views Theme**.

That page is the admin module `views-theme-settings` (`src/Resources/app/administration/src/module/views-theme-settings/`). It registers a `settingsItem` in the `plugins` group (the **Extensions** column) with `iconComponent: 'views-theme-icon'`: the Views mark from `public/img/views-logo.svg` (without the wordmark) as an inline SVG in `currentColor`, so it follows the admin light/dark text color and renders `<sw-system-config domain="ViewsTheme.config" sales-channel-switchable>`, so every card and field below comes from `config.xml` with no duplicated form. Add a new option in `config.xml` only; it appears on the page automatically. Access requires the `system.system_config` privilege. Snippets: `viewsTheme.settings.*` in the admin `en-GB.json` / `de-DE.json`.

Admin changes need an administration build (`bin/build-administration.sh`), run by the human.

### Shop information

Theme-owned contact data for the footer company column. The theme does **not** read contact fields from `core.basicInformation.*` (the admin has no phone field and the company card is behind a feature flag). Exceptions: the shop name (`core.basicInformation.shopName`, else the sales channel name) and CMS page links such as the contact form (`contactPage`). Every field is optional and renders nothing when empty; plugin config can be overridden per sales channel.

| Config key | Type | Default | Description |
|------------|------|---------|-------------|
| `ViewsTheme.config.shopInfoStreet` | string | – | Street line |
| `ViewsTheme.config.shopInfoZipcode` | string | – | Zip code (shares a line with city) |
| `ViewsTheme.config.shopInfoCity` | string | – | City |
| `ViewsTheme.config.shopInfoPhone` | string | – | Phone (`tel:` link) |
| `ViewsTheme.config.shopInfoEmail` | string | – | Email (`mailto:` link) |

See [Footer](features/footer.md#contact-data).

### Variants Grid

| Config key | Type | Default | Description |
|------------|------|---------|-------------|
| `ViewsTheme.config.variantsGridActive` | bool | `false` | Master toggle for the variants grid |
| `ViewsTheme.config.variantsGridRowsPerPage` | int | `10` | Max variant rows per page (`1`–`100`) |
| `ViewsTheme.config.variantsGridShowPreviewColumn` | bool | `true` | Show preview (image) column |
| `ViewsTheme.config.variantsGridShowProductNumberColumn` | bool | `true` | Show product number (SKU) column |

Column options apply to the table header and every row, including AJAX-paginated loads.

See [Variants grid](features/variants-grid.md).

### Delivery Date

| Config key | Type | Default | Description |
|------------|------|---------|-------------|
| `ViewsTheme.config.deliveryDateActive` | bool | `false` | Master toggle for preferred delivery date |
| `ViewsTheme.config.deliveryDateCustomFieldKey` | string | `preferred_delivery_date` | Order custom-field key for the selected date |
| `ViewsTheme.config.deliveryDateMaxDays` | int | `30` | Max selectable days from today (`1`–`365`) |

See [Preferred delivery date](features/delivery-date.md).

### Checkout

| Config key | Type | Default | Description |
|------------|------|---------|-------------|
| `ViewsTheme.config.checkoutArrivalDateActive` | bool | `true` | Show `Checkout:ArrivalDate` on the confirm summary |
| `ViewsTheme.config.checkoutShippingCalculationActive` | bool | `true` | Checked by the callers `Cart:Page:Aside` and `Cart:Drawer:Body` before they render `Cart:Shipping` |

Never write `config('…') ?? true` for a bool: Twig compiles `??` to a truthiness test, so a stored `false` falls back to `true`. Test the value directly (`{% if config('…') %}`) and rely on the `config.xml` default.

See [Checkout confirm](features/checkout-confirm.md), [Cart page](features/cart-page.md), [Cart drawer](features/cart-drawer.md).

### Plugin icon

The extension list icon is `src/Resources/config/plugin.png` (256×256, transparent), linked through `extra.plugin-icon` in `composer.json`. It is the coloured Views mark (`#F87060`, no wordmark) rendered from the source `src/Resources/config/plugin.svg`. Regenerate after editing the SVG: `rsvg-convert -w 256 -h 256 plugin.svg -o plugin.png`. Shopware reads the icon on `plugin:refresh`.

## Theme configuration (`theme.json`)

Path: `src/Resources/theme.json`.

### Theme preview

`theme.json` `previewMedia` points at `src/Resources/theme-preview.png` (684×414, the Views mark and wordmark on `#faf5ee`), shown in the Theme Manager and the Shopping Experiences theme list. It is rendered from the source `src/Resources/theme-preview.svg`, which inlines the logo from `public/img/views-logo.svg`. Regenerate after editing the SVG: `rsvg-convert theme-preview.svg -o theme-preview.png`. Shopware imports the media on `theme:refresh` / plugin update, and only when the path changed or the theme has no preview yet, so re-importing an edited image under the same path needs the theme's preview media removed first.

### Design system (summary)

| Token | Value |
|-------|--------|
| Style | Modern Minimal |
| Font | Figtree (`sw-font-family-base`) |
| Primary accent | `#F87060` (`sw-color-brand-primary`) |
| Secondary | `#71816D` (`sw-color-brand-secondary`) |
| Light / dark | `#faf5ee` / `#2E282A` |
| Base grid | 8px (SCSS spacing scale) |
| Icon sizes | `$icon-sizes` in `scss/override.scss`: 1→12px … 6→40px |
| Line heights | `$line-heights` in `scss/override.scss` (theme fields `line-height-tight` 1.25 / `line-height-normal` 1.5) → `--line-height-1` / `--line-height-2` |

Authoritative field defaults: `theme.json` / theme fields table below.

**Pale colors.** `scss/override.scss` emits `--{name}-pale` on `:root` for each `$theme-colors` key (`--primary-pale`, `--secondary-pale`, `--success-pale`, `--info-pale`, `--warning-pale`, `--danger-pale`, `--light-pale`, `--dark-pale`). Each token is `oklab(from var(--{name}) …)` with the same channel scale (`l * 1.34373`, `a * 0.07784`, `b * 0.12895`). `$prefix` is empty, so the names match Bootstrap’s `--primary` and the rest. The map is declared in that file, ahead of Bootstrap’s `!default`, with the same eight keys.

**Icon size utility** (Bootstrap `$utilities`, sets `--icon-size` for `.icon`):

| Class | Size |
|-------|------|
| `.icon-size-1` | 12px |
| `.icon-size-2` | 16px |
| `.icon-size-3` | 20px |
| `.icon-size-4` | 24px |
| `.icon-size-5` | 32px |
| `.icon-size-6` | 40px |

Responsive: `.icon-size-{breakpoint}-{n}` (e.g. `icon-size-2 icon-size-md-4`).

**Appearance utility** (Bootstrap `$utilities`): `.appearance-none` is the theme Bootstrap class for `appearance: none`.

**Text muted utility** (Bootstrap color utility): `.text-muted` sets `color` to the theme field `muted` (`$muted`, `#66605D`). `scss/_utilities.scss` merges that value into the color utility and generates the group again, after Storefront. Not responsive. `.text-opacity-*` does not tint it.

**Text decoration hover** (Bootstrap `$utilities`): `scss/_utilities.scss` sets `state: hover` on `text-decoration` and generates that group again. `.text-decoration-none-hover:hover` (and the underline and line-through variants) set `text-decoration` on hover. That beats `a:hover { text-decoration: underline }`. `.text-decoration-none` alone does not.

**Font family utility** (Bootstrap `$utilities`):

| Class | Declaration | Source |
|-------|-------------|--------|
| `.font-base` | `font-family: var(--body-font-family)` | `sw-font-family-base` (Bootstrap `--body-font-family`) |
| `.font-headline` | `font-family: var(--heading-font-family)` | `sw-font-family-headline` (`--heading-font-family` in `scss/override.scss`) |
| `.font-monospace` | `font-family: var(--font-monospace)` | Bootstrap monospace, kept |

Not responsive. Use these in CVA / `class` the same way as `.icon-size-*`.

**Column count utility** (Bootstrap `$utilities`, `grid-template-columns`):

The count is `$grid-columns` in `scss/overrides/_utilities.scss` (default `12`). The same variable is Bootstrap’s flex-grid column count.

| Class | Declaration |
|-------|-------------|
| `.grid-columns-1` … `.grid-columns-12` | `grid-template-columns: repeat(N, minmax(0, 1fr))` |

Responsive: `.grid-columns-{breakpoint}-{n}` (e.g. `grid-columns-2 grid-columns-lg-4`). Suggest results use `grid-columns-4`.

### Inheritance and assets

| Key | Value |
|-----|--------|
| `views` | `["@Storefront", "@ViewsTheme"]` |
| `style` | Override SCSS → Storefront Bootstrap → theme base SCSS |
| `script` | Storefront + compiled `views-theme.js` |
| `asset` | `app/storefront/src/assets` |

### Local fonts (Figtree)

Variable fonts live under `app/storefront/src/assets/fonts/` and are declared in SCSS (`scss/_fonts.scss` → imported from `base.scss`) via `$app-css-relative-asset-path`:

| File | Face |
|------|------|
| `figtree-var.woff2` | Figtree normal (weight 300–900) |
| `figtree-italic-var.woff2` | Figtree italic (weight 300–900) |

`storefront/layout/meta.html.twig` (`views_theme_font_preload`) preloads `figtree-var.woff2`. Without the preload, the browser only finds the font after it has parsed `all.css`. The `href` is `asset('assets/fonts/figtree-var.woff2', 'theme')` with the version query removed, so it equals the URL the `@font-face` resolves to and the browser reuses the preloaded response. The italic face is not preloaded. The preload is left out on the Vite dev server, which serves fonts from a different URL. If you rename the normal face in `scss/_fonts.scss`, update the preload too.

`theme.json` sets `sw-font-family-base` to `'Figtree', sans-serif`. After adding or changing font files, run `bin/console theme:compile` (or rebuild storefront) so assets are copied into `public/theme/{id}/assets/fonts/`.

### Static asset CSS (Vite dev)

Icon-pack stylesheets under `app/storefront/src/assets/css/icons/` are linked from `storefront/layout/meta.html.twig`:

| Mode | How they load |
|------|----------------|
| Production | `asset(..., 'theme')` after `theme:compile` copies `asset` paths into the theme package |
| Vite dev (`make dev-storefront`) | Same `<link>`s point at source via the ViewsTheme Vite `/@fs/…/src/assets/css/…` URL (derived from the theme `main.js` script entry) |

There is no auto-reload for these files: edit + hard-refresh the storefront. Theme SCSS (`theme.json` `style`) still uses `/theme-scss/all.css` with full reload.

### Theme SCSS overrides

Global token assigns that sit outside a single component live in `app/storefront/src/scss/_theme.scss`, imported last from `base.scss`. `theme.json` compiles that file after `@StorefrontBootstrap`, so the rules follow Bootstrap in the theme stylesheet. `.btn-light` is the pen Light Solid button: `--light` fill, `--border-color` stroke on rest, hover, and disabled, and an active stroke that follows `--btn-active-bg`. `.btn-outline-light` is the pen Light Outline button: white fill, `--border-color` stroke, `--body-color` label, `--light` hover, and `--border-color` active. It is excluded from the outline underline.

Breakpoints use `$grid-breakpoints` from `override.scss` via `@include media-breakpoint-up(...)`. Footer columns that open from `data-collapse-until` up use the `vi-collapse-until` mixin (attribute selector plus `media-breakpoint-up` for each named breakpoint except `xs`).

Brand colors, spacing, and theme-field colors are Shopware / Bootstrap custom properties (`--sw-*`, `--spacing-*`, `--vi-*` from `custom.css`). There is no separate utility compiler.

### Theme fields (admin)

Views fields sit on their own theme-manager tabs. Storefront defaults stay on **General** (`tab` omitted). Each Views field uses `block: "default"` so the tab has no extra card title. Tab labels: admin snippets `sw-theme.ViewsTheme.{tab}.label`, with `config.tabs` in `theme.json` as the fallback (en-GB / de-DE).

| Tab | Field | Type | Default / notes |
|-----|-------|------|-----------------|
| Colors (`colors`) | `vi-primary` | color | `#F87060`. `custom.css: true` → `--vi-primary` |
| Colors | `vi-secondary` | color | `#71816D`. `custom.css: true` → `--vi-secondary` |
| Colors | `vi-light` | color | `#faf5ee`. `custom.css: true` → `--vi-light` |
| Colors | `vi-dark` | color | `#2E282A`. `custom.css: true` → `--vi-dark` |
| Colors | `vi-text-color` | color | `#2E282A`. `custom.css: true` → `--vi-text-color` |
| Colors | `vi-headline-color` | color | `#2E282A`. `custom.css: true` → `--vi-headline-color` |
| Typography (`typography`) | `vi-font-family-base` | text | `'Figtree', sans-serif`. `custom.css: true` → `--vi-font-family-base` |
| Typography | `vi-font-family-headline` | text | `'Figtree', sans-serif`. `custom.css: true` → `--vi-font-family-headline` |
| Media (`media`) | `page-logo` | media | Empty default. `Page:Logo` uses this, else the bundled Views logo — never Storefront `sw-logo-*`. `custom.css: true` → `--page-logo`. `fullWidth: true`. See [Logo](features/logo.md) |
| Media | `logo-width-mobile` | number | `80` (px), below `md`. `scss: false` |
| Media | `logo-width-tablet` | number | `100` (px), `md` up to below `lg`. `scss: false` |
| Media | `logo-width-desktop` | number | `120` (px), `lg` up. `scss: false` |

The three `logo-width-*` fields size the header logo only (`Page:Header:Main`). `storefront/layout/meta.html.twig` prints a `<style>` in `layout_head_theme_css_vars` that assigns `--vi-logo-w` on `.vi-header-main` in px per breakpoint (`theme_config('breakpoint.md' / 'breakpoint.lg')`); `Page:Logo` reads it in `Logo.css`. `Page:Header:Minimal` does not assign it, so its logo stays auto width. Image source is independent of those widths: [Logo](features/logo.md).

`custom.css` on a theme field opts that field into a `:root` custom property in the document head (`--{field-name}`). It is independent of `scss`: omitted or `false` prints nothing, and `scss: false` still only skips the compiled SCSS variable. A top-level `css` key is invalid: the theme manager only accepts known field setters, and `custom` is the extension bag (`setCustom`). `layout_head_theme_css_vars` renders `views_theme_css_vars()` and does not emit Shopware’s `scss`-based set. Every field in the table except `logo-width-*` sets `custom.css: true`. `views_theme_css_vars()` reads the sales channel from the Twig `context` variable, and from `salesChannelContext` when that mail-template variable is present. It does not call `TwigContextHelper`, which Shopware adds in 6.7.12.

Form control focus is the inset stroke from `$input-focus-box-shadow` and `$form-select-focus-box-shadow` in `scss/overrides/_form.scss`. The input-group shell paints that same inset on `:focus-within` in `scss/_form.scss`.

### Icons

`theme.json` may define an `icons` property:

```json
"icons": {
  "pack": "bold",
  "mode": "css"
}
```

| Consumer | Role |
|----------|------|
| [`vi_icon`](twig/vi-icon.md) | Uses `pack` / `mode` as defaults when the second argument is omitted |
| `storefront/layout/meta.html.twig` | Links the CSS icon pack stylesheet when `mode` is `css` |

`ThemeConfigSubscriber` exposes full `theme.json` as the Twig parameter `themeParameters` (via `ThemeParametersResolver`) for the stylesheet link and related Twig defaults. It does **not** assign CSS custom properties — those come from Shopware theme compile (`--sw-*`) and `views_theme_css_vars()` (`--vi-*`). UX components do not need `themeParameters` for icons beyond `vi_icon` defaults.

CSS packs are built with `npm run build:icons` (`build.icons.mts`). Each pack lists Iconify icons as strings (class = name) or `{ icon, class }` for a custom CSS class suffix after `icon-`:

```ts
"heart",
{ icon: "star-fill", class: "star-fill-custom" }, // → .icon-star-fill-custom
```
