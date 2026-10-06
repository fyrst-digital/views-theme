# Product configurator

Theme-owned variant configurator for the PDP and CMS buy box. `Product:BuyContainer` mounts it when the product is a variant, settings are present, and the variants grid is off.

Shopware keeps the switch HTTP API. The theme does not use `data-variant-switch` or `VariantSwitchPlugin`.

## Composition

```
Product:Configurator (class VM + JS executor)
├─ group → Product:Configurator:Group (anonymous)
│    ├─ select → Product:Configurator:Select (class VM + JS)   when displayType is select
│    └─ options → Product:Configurator:Option (class VM + JS)  otherwise, one per option
```

A variant change always reloads the variant’s product page. CMS buy boxes use that same redirect.

## Display

Groups are the `PropertyGroupCollection` from `ProductConfiguratorLoader`.

| Group `displayType` | UI |
|---------------------|----|
| `select` | Label + `<select>` |
| `text`, `color`, `media`, anything else | Fieldset, legend, radio per option |

An option with `configuratorSetting.media` renders as `media` even when the group type differs. Otherwise the group type is used. Option media is a thumbnail only when the resolved type is `media`. Legacy `image` stays a text fallback.

Selected state is `option.id` in `product.optionIds` (the buy-box product, including CMS). Non-combinable options stay selectable: radios add a visually hidden unavailable note; selects append `detail.unavailable` and set `title` to `detail.unavailableTooltip`. The legend uses `component.product.configurator.legend` with `%hidden_cls%` = `visually-hidden`.

Color and media controls are 60px with 2px padding (`Option.css`). The color fill is `--vi-product-configurator-option-bg` on that option. The checked control uses a 2px border.

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

Nests: `group` (forwards `product`, `elementId`, `configuratorId`).

### `Product:Configurator:Group` (anonymous)

| Prop | Default | Notes |
|------|---------|--------|
| `group` | required | `PropertyGroupEntity` |
| `product` | `null` | Forwarded |
| `elementId` | `null` | Forwarded |
| `configuratorId` | `null` | Forwarded |
| `cva` | `{}` | `root`, `legend`, `options`, `option`, `select` |

### `Product:Configurator:Option` (class-backed)

| Prop / field | Notes |
|--------------|--------|
| `option`, `group`, `product`, `elementId`, `configuratorId` | Inputs |
| `identifier` | `groupId-optionId`, plus `elementId` when set |
| `active` | Option id is in `product.optionIds` |
| `displayType` | `media` when the configurator setting has media, else the group type |
| `media`, `colorHex`, `name`, `hideName`, `combinable` | Label content |
| `cva` | `root`, `input`, `label`, `media`, `name` |

`label` variant `combinable: no` is `text-decoration-line-through`. `name` variant `hidden: yes` is `visually-hidden` when a swatch already names the option.

### `Product:Configurator:Select` (class-backed)

| Prop / field | Notes |
|--------------|--------|
| `group`, `product`, `elementId`, `configuratorId` | Inputs |
| `controlId` | `groupId`, or `groupId-elementId` when a CMS id is set. `name` stays `groupId` |
| `choices` | `value`, `name`, `selected`, `combinable` |
| `cva` | `root`, `label`, `control` |

## JavaScript

`@views-theme/modules/configurator/store.js` holds one session per `configuratorId` (`attached`, `busy`, `options`, `switched`, `focusId`). `options` is `groupId => optionId`.

| Role | Import | API |
|------|--------|-----|
| `Product:Configurator` | `configurator/store.js`, `shared/http.js` | `attach` / `commit` / `detach`. `switch()` reads the snapshot |
| `Product:Configurator:Option` | `configurator/store.js` only | `change` on its root → `apply(id, { groupId, optionId, focusId })` |
| `Product:Configurator:Select` | `configurator/store.js` only | same, `optionId` is that select's value |

The executor does not query radios or selects. Controls do not query siblings. `apply` no-ops when that id has no executor.

On attach, Configurator commits the PHP `selected` map. A change merges that group, sets `switched` to the group id (Shopware `switched` / `switchedGroup`), and calls `switch()`.

Every page, including a CMS buy box, calls `GET frontend.detail.switch`. The JSON response is `{ url, productId }`. The theme saves focus (`variant-switch`, `[id="…"]`), shows the page loader, and `location.replace(url)`. Query: `switched` = group id, `options` = JSON object of group id → option id. The theme does not call `frontend.cms.buybox.switch` or publish `updateBuyWidget`.

A failed request clears `busy` and `aria-busy`. A second change while `busy` is ignored.

## Key source files

| Area | Path |
|------|------|
| Shell | `src/Resources/views/components/Product/Configurator.{php,html.twig,cva.twig,js}` |
| Group | `src/Resources/views/components/Product/Configurator/Group.{html.twig,cva.twig}` |
| Option | `src/Resources/views/components/Product/Configurator/Option.{php,html.twig,cva.twig,js,css}` |
| Select | `src/Resources/views/components/Product/Configurator/Select.{php,html.twig,cva.twig,js}` |
| Store | `src/Resources/app/storefront/src/modules/configurator/store.js` |
| Mount | `src/Resources/views/components/Product/BuyContainer.html.twig` |

## Related

- [Buy container](buy-container.md) — mount gate
- [Variants grid](variants-grid.md) — replaces the configurator when active
- [JavaScript](../conventions/javascript.md) — store import boundary
