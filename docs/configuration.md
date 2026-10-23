# Configuration

ViewsTheme has two configuration surfaces: **plugin config** (system config) and **theme config** (`theme.json`).

## Plugin configuration

Defined in `src/Resources/config/config.xml`. Editable in the Shopware administration under the plugin settings.

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

See [Checkout confirm](features/checkout-confirm.md).

## Theme configuration (`theme.json`)

Path: `src/Resources/theme.json`.

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
| Media (`media`) | `vi-logo` | media | `custom.css: true` → `--vi-logo`. `fullWidth: true` |

`custom.css` on a theme field opts that field into a `:root` custom property in the document head (`--{field-name}`). It is independent of `scss`: omitted or `false` prints nothing, and `scss: false` still only skips the compiled SCSS variable. A top-level `css` key is invalid: the theme manager only accepts known field setters, and `custom` is the extension bag (`setCustom`). `layout_head_theme_css_vars` renders `views_theme_css_vars()` and does not emit Shopware’s `scss`-based set. Every field in the table sets `custom.css: true`.

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
