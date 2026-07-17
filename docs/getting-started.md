# Getting started

## Requirements

- Shopware 6.7 (Core & Storefront)

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

## Theme assignment

Assign **ViewsTheme** to the sales channel in the administration (Sales Channel → Theme), or via CLI if you use theme assignment tooling in your project.

## Asset build

After SCSS or storefront JS changes:

```bash
# From the Shopware project root (typical storefront build)
bin/build-storefront.sh
# or
bin/console theme:compile
```

Compiled storefront JS for this theme is expected at:

`src/Resources/app/storefront/dist/storefront/js/views-theme/views-theme.js`

(see `theme.json` `script` entry).

## Configuration

Plugin settings live under **Extensions → My extensions → ViewsTheme → Configure**.

See [Configuration](configuration.md) for option names and defaults.

## Next steps

- [Architecture](architecture.md)
- [CSS class conventions](conventions/css-classes.md)
- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
