# ViewsTheme

A Shopware 6.7 storefront theme focused on high-fidelity ecommerce UI design.

## Requirements

- Shopware 6.7 (Core & Storefront)

## Installation

Place the plugin under `custom/static-plugins/ViewsTheme`, then install and activate:

```bash
bin/console plugin:install --activate ViewsTheme
```

Full setup (theme assignment, asset build): [docs/getting-started.md](docs/getting-started.md).

## Documentation

| Topic | Link |
|-------|------|
| Docs index | [docs/README.md](docs/README.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Configuration | [docs/configuration.md](docs/configuration.md) |
| CSS class API | [docs/conventions/css-classes.md](docs/conventions/css-classes.md) |
| JavaScript selectors | [docs/conventions/javascript.md](docs/conventions/javascript.md) |
| Twig extensions | [docs/twig/overview.md](docs/twig/overview.md) |
| Variants grid | [docs/features/variants-grid.md](docs/features/variants-grid.md) |
| Preferred delivery date | [docs/features/delivery-date.md](docs/features/delivery-date.md) |

## Features (summary)

- **Variants grid** — paginated multi-variant add-to-cart on the PDP (plugin config).
- **Preferred delivery date** — optional date picker on checkout confirm, stored as an order custom field.
- **Twig class API** — `vi_define_classes`, `vi_attr_classes`, `vi_classes` for overridable component classes.
- **Icons** — `vi_icon` for inline SVG / CSS icons.

## License

MIT
