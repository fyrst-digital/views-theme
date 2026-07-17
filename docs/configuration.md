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

### Inheritance and assets

| Key | Value |
|-----|--------|
| `views` | `["@Storefront", "@ViewsTheme"]` |
| `style` | Override SCSS → Storefront Bootstrap → theme base SCSS |
| `script` | Storefront + compiled `views-theme.js` |
| `asset` | `app/storefront/src/assets` |

### Theme fields (admin)

| Field | Type | Default / notes |
|-------|------|-----------------|
| `sw-color-brand-primary` | color | `#19BF56` |
| `sw-font-family-base` | text | `'Figtree', sans-serif` |
| `sw-logo-desktop` | media | |
| `sw-logo-tablet` | media | |
| `sw-logo-mobile` | media | |
| `sw-logo-share` | media | |
| `sw-logo-favicon` | media | |

### Icons

`theme.json` may define an `icons` property for theme icon packs (Shopware theme icon config). Icon rendering is documented under [`vi_icon`](twig/vi-icon.md).
