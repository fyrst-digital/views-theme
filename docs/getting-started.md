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

## Theme assignment

Assign **ViewsTheme** to the sales channel in the administration (Sales Channel → Theme), or via CLI if you use theme assignment tooling in your project.

## Asset build

### Theme CSS (Tailwind)

Global `theme.css` is built from `app/storefront/src/css/` (not edited by hand):

```bash
# From the ViewsTheme plugin root
npm install
npm run build:css    # → app/storefront/src/assets/css/theme.css
# or while developing styles:
npm run watch:css
```

Commit the built `theme.css` with source changes so `theme:compile` works without npm.

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

(see `theme.json` `script` entry).

## Configuration

Plugin settings live under **Extensions → My extensions → ViewsTheme → Configure**.

See [Configuration](configuration.md) for option names and defaults.

## Next steps

- [Architecture](architecture.md)
- [CSS class conventions](conventions/css-classes.md)
- [Variants grid](features/variants-grid.md)
- [Preferred delivery date](features/delivery-date.md)
