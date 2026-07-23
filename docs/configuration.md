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

## Theme configuration (`theme.json`)

Path: `src/Resources/theme.json`.

### Design system (summary)

| Token | Value |
|-------|--------|
| Style | Modern Minimal |
| Font | Figtree (`sw-font-family-base`) |
| Primary accent | `#F87060` (`sw-color-brand-primary`) |
| Secondary / tertiary | `#71816D` / `#A393BF` |
| Light / dark | `#faf5ee` / `#2E282A` |
| Base grid | 8px (SCSS spacing scale) |

Authoritative field defaults: `theme.json` / theme fields table below.

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

Extra stylesheets under `app/storefront/src/assets/css/` (e.g. `theme.css`, conditional icon packs) are linked from `storefront/layout/meta.html.twig`:

| Mode | How they load |
|------|----------------|
| Production | `asset(..., 'theme')` after `theme:compile` copies `asset` paths into the theme package |
| Vite dev (`make dev-storefront`) | Same `<link>`s point at source via the ViewsTheme Vite `/@fs/…/src/assets/css/…` URL (derived from the theme `main.js` script entry) |

There is no auto-reload for these files: edit + hard-refresh the storefront. Theme SCSS (`theme.json` `style`) still uses `/theme-scss/all.css` with full reload.

### Tailwind CSS (`theme.css`)

Global component CSS, design tokens, and **prefixed utilities** are built with **Tailwind v4 CLI** into the committed asset `app/storefront/src/assets/css/theme.css`.

| Path | Role |
|------|------|
| `app/storefront/src/css/main.css` | Entry: theme + utilities (`prefix(tw)`), `@theme static`, `@source`, components |
| `app/storefront/src/css/components.css` | Custom component rules (`.btn-*`, layout chrome, …) |
| `app/storefront/src/assets/css/theme.css` | **Build output** (linked in storefront; commit after changes) |

```bash
# From the ViewsTheme plugin root
npm run build:css    # one-shot
npm run watch:css    # rebuild on source edit
```

**Imports:** `tailwindcss/theme` + `tailwindcss/utilities` only — **no Preflight** (Bootstrap handles base). Both use `prefix(tw)`.

**Utility classes** use the `tw:` prefix so they never clash with Bootstrap names:

```html
<div class="d-flex gap-2 tw:lg:gap-4">…</div>
```

| HTML | Generated selector |
|------|--------------------|
| `tw:flex` | `.tw\:flex` |
| `tw:lg:gap-2` | `@media (width >= …) { .tw\:lg\:gap-2 { … } }` |

Theme CSS variables are also prefixed in the build (`--tw-breakpoint-lg`, `--tw-color-brand-primary`, …). Class scanning is **explicit only** (`source(none)`): `@source` covers Twig under `views/` and storefront JS/TS — not docs or the rest of the repo.

`@theme` breakpoints and spacing match `scss/override.scss` (`sm` 520px … `xxl` 1600px, `--spacing: 4px`). Brand colors reference Shopware runtime vars (`--sw-color-brand-*`).

In component CSS:

| Need | Use |
|------|-----|
| Token as a property value | `var(--tw-color-brand-primary)`, `var(--tw-spacing)`, … (prefix applied in output) |
| Responsive rule at a theme breakpoint | `@variant lg { … }` (compiles to `@media (width >= 1024px)`) |
| Breakpoint length in `@media` | `theme(--breakpoint-lg)` (build-time) — **not** `var(--breakpoint-*)` (invalid in media queries) |
| `@apply` | Prefixed names: `@apply tw:flex tw:gap-2` |

**Cascade vs Bootstrap:** Shopware/Bootstrap CSS is unlayered. Unlayered styles always beat `@layer` styles, so component rules are intentionally **not** wrapped in `@layer` — they load after Bootstrap via `theme.css` and win. Theme tokens stay in `@layer theme`; utilities stay in `@layer utilities` (class names do not collide thanks to `tw:`).

### Theme fields (admin)

| Field | Type | Default / notes |
|-------|------|-----------------|
| `sw-color-brand-primary` | color | `#F87060` |
| `sw-color-brand-secondary` | color | `#71816D` |
| `sw-color-brand-tertiary` | color | `#A393BF` |
| `sw-color-brand-light` | color | `#faf5ee` |
| `sw-color-brand-dark` | color | `#2E282A` |
| `sw-font-family-base` | text | `'Figtree', sans-serif` |
| `sw-logo-desktop` | media | |
| `sw-logo-tablet` | media | |
| `sw-logo-mobile` | media | |
| `sw-logo-share` | media | |
| `sw-logo-favicon` | media | |

Form controls use a global last-resort focus outline in `scss/_form.scss` (transparent outline by default, primary on `:focus`). Prefer component-level CSS when possible.

### Icons

`theme.json` may define an `icons` property:

```json
"icons": {
  "pack": "default",
  "mode": "css"
}
```

| Consumer | Role |
|----------|------|
| [`vi_icon`](twig/vi-icon.md) | Uses `pack` / `mode` as defaults when the second argument is omitted |
| `storefront/layout/meta.html.twig` | Links the CSS icon pack stylesheet when `mode` is `css` |

`ThemeConfigSubscriber` exposes full `theme.json` as the Twig parameter `themeParameters` for the stylesheet link. UX components do not need `themeParameters` for icons.
