# `vi_icon`

Twig function that renders icon markup. Implemented in `src/Twig/ViIcon.php`.

There is also a Twig **macro** at `components/icon/icon.html.twig` (Shopware-style `source()` + `sw_icon_cache`) for template includes. Prefer the path that matches the surrounding code; both are exempt from the `vi_define_classes` map rules.

## Function signature

```twig
{{ vi_icon(name) }}
{{ vi_icon(name, options) }}
```

| Argument | Type | Description |
|----------|------|-------------|
| `name` | `string` | Icon file name without `.svg` |
| `options` | `array` | Optional rendering options (merged over theme defaults) |

### Defaults

When `options` is omitted, null, or empty, `pack` and `mode` are taken from the active theme’s `theme.json` → `icons` (via `ThemeParametersResolver`). Explicit option keys always win.

Hard fallbacks if no theme is available: `pack = 'default'`, `mode = 'svg'`.

ViewsTheme ships `theme.json` with `mode: 'css'` and `pack: 'default'`, so bare `{{ vi_icon('cart') }}` uses CSS mode in the storefront.

### Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pack` | `string` | theme / `'default'` | Icon pack folder under assets |
| `mode` | `string` | theme / `'svg'` | `'svg'` (inline SVG) or `'css'` (empty span with classes) |
| `class` | `string\|string[]` | — | Extra CSS classes appended to the root element (`span` or `svg`) |
| `ariaHidden` | `bool` | `true` | Adds `aria-hidden="true"` in SVG mode |
| `ariaLabel` | `string\|null` | `null` | Optional `aria-label` on the SVG |
| `attr` | `array` | — | Extra HTML attributes merged onto the SVG root (SVG mode only). Prefer `class` for classes; `attr.class` is merged into the same class list |

## Modes

### `svg`

Loads `src/Resources/app/storefront/src/assets/icon/{pack}/{name}.svg`, injects classes and a11y attributes on the `<svg>` root, and returns safe HTML markup.

Classes: `icon icon-{name}` plus any `class` option values.

```twig
{{ vi_icon('cart') }}
{{ vi_icon('heart', { pack: 'default', mode: 'svg', ariaHidden: false, ariaLabel: 'Wishlist' }) }}
{{ vi_icon('search', { mode: 'svg', attr: { focusable: 'false' } }) }}
{{ vi_icon('heart', { mode: 'svg', class: 'vi-alert__icon' }) }}
```

If the SVG file is missing, the function returns empty markup (no exception).

### `css`

Renders a `<span>` with icon classes (no SVG body). Useful when icons are provided purely via CSS (stylesheet linked from `meta.html.twig` when theme `icons.mode` is `css`).

- Default pack: `class="icon icon-{name}"`
- Other pack: `class="icon icon-{name}-{pack}"`

```twig
{{ vi_icon('arrow-right') }}
{{ vi_icon('arrow-right', { mode: 'css' }) }}
{{ vi_icon('x', { class: 'foo bar' }) }}
{{ vi_icon('cart', { class: ['vi-btn__icon', 'is-active'] }) }}
```

## Asset path

```
src/Resources/app/storefront/src/assets/icon/{pack}/{name}.svg
```

Theme assets are registered via `theme.json` (`asset`: `app/storefront/src/assets`).

## Component macro

`@ViewsTheme/components/icon/icon.html.twig`:

```twig
{% from '@ViewsTheme/components/icon/icon.html.twig' import render %}
{{ render('cart', { pack: 'default', size: 'sm' }) }}
```

Supports `pack`, `namespace`, `ariaHidden`, `ariaLabel`, and style tokens (`size`, `color`, `rotation`, `flip`, `class`) appended as `icon-{token}` classes. Uses `themeIconConfig` when present, otherwise `@Storefront` / custom namespace asset paths.

## Related

- [Twig overview](overview.md)
- [Configuration](../configuration.md) (`theme.json` icons)
- [Component conventions](../conventions/components.md) (icon template exempt)
