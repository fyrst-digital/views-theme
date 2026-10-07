# Product configurator

Theme-owned variant configurator for the PDP and CMS buy box. `Product:BuyContainer` mounts it when the product is a variant, settings are present, and the variants grid is off.

Shopware keeps the switch HTTP API. The theme does not use `data-variant-switch` or `VariantSwitchPlugin`.

## Composition

```
Product:Configurator (class VM + JS executor)
└─ Product:Configurator:Group (class VM + JS)
     ├─ Product:Configurator:GroupLabel
     ├─ select → ViewsTheme:Form:Select (no field label)
     └─ otherwise → Product:Configurator:Option (class VM, radio shell)
          └─ ViewsTheme:Button (tag=label)
               text | color | media
```

A variant change always reloads the variant’s product page. CMS buy boxes use that same redirect.

## Display

Groups are the `PropertyGroupCollection` from `ProductConfiguratorLoader`.

`Product:Configurator:Group` is one `<fieldset>` per group. `displayType === 'select'` renders `Form:Select`. Every other group type renders one `Product:Configurator:Option` per option.

`ConfiguratorOptionFace` picks the label content (`kind`: `text`, `color`, `media`). Legacy `image`, empty, and unknown types are `text`. An option with `configuratorSetting.media` is `media` even when the group type differs, and the thumbnail is that setting media. Otherwise group type `media` uses the option's own media when that `MediaEntity` exists. Group type `color` uses `colorHex`.

| Kind | UI |
|------|----|
| `text` | Visible name |
| `color` | 60px swatch. Name is visually hidden only when `colorHex` is set |
| `media` | Thumbnail when a `MediaEntity` exists. Name is visually hidden only then |

The label is `ViewsTheme:Button` (`tag=label`, `color=outline-secondary`). The unavailable note is Button `append`. A color hex sets `--vi-product-configurator-option-bg` on that button.

Selected state is `option.id` in `product.optionIds` (the buy-box product, including CMS). Non-combinable options stay selectable: radios add a visually hidden unavailable note; selects append `detail.unavailable` and set `title` to `detail.unavailableTooltip`. `Product:Configurator:GroupLabel` renders the legend from `component.product.configurator.legend` with `%hidden_cls%` = `visually-hidden`.

Color and media controls are 60px with 2px padding (`Option.css`). The color fill is `--vi-product-configurator-option-bg` on that option. The checked control uses a 2px border (`Option.css`).

## Props

### `Product:Configurator` (class-backed)

| Prop / field | Default | Notes |
|--------------|---------|--------|
| `product` | required | `SalesChannelProductEntity` |
| `configuratorSettings` | `null` | `PropertyGroupCollection` |
| `elementId` | `null` | CMS element id. Unique control ids and `configuratorId` when several buy boxes share a page |
| `cva` | `{}` | `Configurator.cva.twig`: `root`, `group` |

### Derived

| Field | Source |
|-------|--------|
| `visible` | Parent id and at least one group |
| `configuratorId` | `elementId`, otherwise `parentId` |
| `selected` | `groupId => optionId` for the current variant. Store seed |
| `switchUrl` | `frontend.detail.switch` |
| `groups` | `list<PropertyGroupEntity>` |

Nests: `group` (class plus forwarded attrs on `Product:Configurator:Group`).

### `Product:Configurator:Group` (class-backed)

The root is a `<fieldset>`. `GroupLabel` is the legend. `displayType === 'select'` mounts `ViewsTheme:Form:Select` with no `label`. Otherwise it mounts one `Product:Configurator:Option` per group option. `data-component` stays on the fieldset so one change listener hears the select and the radios.

| Prop / field | Notes |
|--------------|--------|
| `group`, `product`, `elementId`, `configuratorId` | Inputs |
| `groupId`, `groupName` | From the group |
| `select` | `displayType === 'select'` |
| `controlId` | `groupId`, or `groupId-elementId` when a CMS id is set. `name` stays `groupId` |
| `choices` | Built only when `select`. Form:Select options: `value`, `label`, `selected`, `title?`. Non-combinable choices append `detail.unavailable` to `label` and set `title` to `detail.unavailableTooltip`. They stay enabled |
| `cva` | `root`, `legend` (extras only; classes live on `GroupLabel`), `options`, `option`, `control` (`select:class`). `form-select` comes from Form:Select |

### `Product:Configurator:Option` (class-backed)

| Prop / field | Notes |
|--------------|--------|
| `option`, `group`, `product`, `elementId`, `configuratorId` | Inputs |
| `identifier` | `groupId-optionId`, plus `elementId` when set |
| `active` | Option id is in `product.optionIds` |
| `combinable` | Label `combinable` variant, and the unavailable note |
| `face` | `ConfiguratorOptionFace`: `kind`, `name`, `colorHex`, `media`. `hidesName()` is true only when the swatch or thumbnail is shown |
| `cva` | `root`, `input`, `label` (`combinable`, `kind`), `media`, `name` (`hidden: yes` is `visually-hidden`) |

No `data-component`. `label` variant `combinable: no` is `text-decoration-line-through`. `kind` `color` / `media` adds the swatch class. The label classes sit on `ViewsTheme:Button`.

### `Product:Configurator:GroupLabel` (anonymous)

`<legend>` for one group. Prop `name` is the group name. No `data-component`. `cva` slot `root` is `vi-product-configurator-group__legend fs-5 fw-semibold`.

## JavaScript

`@views-theme/modules/configurator/store.js` holds one session per `configuratorId` (`busy`, `options`, `switched`, `focusId`). `options` is `groupId => optionId`.

| Role | Import | API |
|------|--------|-----|
| `Product:Configurator` | `configurator/store.js`, `shared/http.js` | `attach` / `commit` / `detach`. `switch()` reads the snapshot |
| `Product:Configurator:Group` | `configurator/store.js` only | `change` on the fieldset → `apply(id, { groupId, optionId, focusId })`. `groupId` is the control `name`, `optionId` is its value, `focusId` is its `id` |

The executor does not query radios or selects. Group does not query its controls; it reads the change event target. `apply` no-ops when that id has no executor.

On attach, Configurator commits the PHP `selected` map. A change merges that group, sets `switched` to the group id (Shopware `switched` / `switchedGroup`), and calls `switch()`.

Every page, including a CMS buy box, calls `GET frontend.detail.switch`. The JSON response is `{ url, productId }`. The theme saves focus (`variant-switch`, `[id="…"]`), shows the page loader, and `location.replace(url)`. Query: `switched` = group id, `options` = JSON object of group id → option id. The theme does not call `frontend.cms.buybox.switch` or publish `updateBuyWidget`.

A failed request clears `busy` and `aria-busy`. A second change while `busy` is ignored.

## Key source files

| Area | Path |
|------|------|
| Shell | `src/Resources/views/components/Product/Configurator.{php,html.twig,cva.twig,js}` |
| Group | `src/Resources/views/components/Product/Configurator/Group.{php,html.twig,cva.twig,js}` |
| Group label | `src/Resources/views/components/Product/Configurator/GroupLabel.{html.twig,cva.twig}` |
| Option | `src/Resources/views/components/Product/Configurator/Option.{php,html.twig,cva.twig,css}` |
| Face | `src/Struct/ConfiguratorOptionFace.php` |
| Store | `src/Resources/app/storefront/src/modules/configurator/store.js` |
| Mount | `src/Resources/views/components/Product/BuyContainer.html.twig` |

## Related

- [Buy container](buy-container.md) — mount gate
- [Variants grid](variants-grid.md) — replaces the configurator when active
- [JavaScript](../conventions/javascript.md) — store import boundary
