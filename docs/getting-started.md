# Getting started

## Requirements

- Shopware 6.7.11+ (Core & Storefront)

## Installation

Place the plugin under `custom/static-plugins/ViewsTheme`, then install and activate:

```bash
bin/console plugin:install --activate ViewsTheme
```

If the plugin is already installed and you pulled new code:

```bash
bin/console plugin:refresh
bin/console plugin:update ViewsTheme
```

## Cloud Agent

Cursor Cloud Agents create this shop with `shopware-cli` at `/home/ubuntu/shopware` on host MariaDB and PHP, and link this repository at `custom/static-plugins/ViewsTheme`. The Shopware release is the minimum version that satisfies `shopware/core` and `shopware/storefront` in `composer.json` (currently `^6.7.11`, installed as 6.7.11.0), with a database and a generated demo catalog (categories, products, manufacturers, customers, orders, media, reviews). That release pins `dompdf/dompdf` 3.1.4, which Composer blocks on published advisories, so the installer sets `COMPOSER_NO_SECURITY_BLOCKING=1` for this project create. The Shopware Security plugin does not patch third-party libraries. Storefront: http://127.0.0.1:8000. Admin: http://127.0.0.1:8000/admin (`admin` / `shopware`). From the shop directory, `shopware-cli project console` runs `bin/console`. ViewsTheme is assigned to the storefront sales channel.

## Theme assignment

Assign **ViewsTheme** to the sales channel in the administration (Sales Channel → Theme), or via CLI if you use theme assignment tooling in your project.

## Asset build

### SCSS / storefront JS

After SCSS or storefront JS changes:

```bash
# From the Shopware project root (typical storefront build)
bin/build-storefront.sh
# or
bin/console theme:compile
```

Compiled storefront JS for this theme is expected at:

`src/Resources/app/storefront/dist/storefront/js/views-theme/views-theme.js`

(see `theme.json` `script` entry). The path may be a **0-byte placeholder** in git until a successful storefront build — an empty file is not a working bundle.

## Configuration

Plugin settings live under **Extensions → My extensions → ViewsTheme → Configure**.

See [Configuration](configuration.md) for option names and defaults.

## Next steps

- [Architecture](architecture.md)
- [CSS class conventions](conventions/css-classes.md)
- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
