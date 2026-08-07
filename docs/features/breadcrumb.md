# Breadcrumb

Theme-owned navigation trail. Single SoT: **`categoryId`** → core `CategoryBreadcrumbBuilder` → `BreadcrumbCollection` → items. Feature flags irrelevant.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| Storefront bridge | `storefront/layout/breadcrumb.html.twig` → resolve id → `Breadcrumb` |
| PDP / CMS placement | Core `cms_breadcrumb` / layout include → bridge |
| `Breadcrumb` | Class VM: `categoryId` → builder → `items`; Twig composes list + separators |
| `Breadcrumb:Item` | Leaf crumb (link / folder / current) |

No core Bootstrap `.breadcrumb` chrome. No theme breadcrumb backend. No `page.breadcrumb` / `sw_breadcrumb_*` dependency.

## Shopware 6.8 review

Today the SoT is `categoryId` → `CategoryBreadcrumbBuilder` inside the component (works with `BREADCRUMB_REWORK` off).

On **Shopware 6.8**, core’s breadcrumb rework is the default: page loaders always expose `page.breadcrumb` (`BreadcrumbCollection`), and legacy `sw_breadcrumb_*` / dual include shapes go away.

**Revisit this implementation then:** whether callers should pass the prebuilt collection (or only `categoryId`), whether the VM should prefer `page.breadcrumb` when present, and whether the layout bridge’s id-normalization from core’s old vars can be simplified or removed.

## Composition

```
Breadcrumb (nav)
└─ ol
   ├─ Breadcrumb:Item
   ├─ separator (caret-right)
   ├─ Breadcrumb:Item
   └─ …
```

## Class component

`Breadcrumb` is a [class UX component](../conventions/ux-components.md#class-components-php-backed):

- `Breadcrumb.php` — `#[PostMount]`: `loadCategory` + `getCategoryBreadcrumbUrls` → map to `items`
- `Breadcrumb.html.twig` — composition only over `items`

Must stay registered via the components `**/*.php` service prototype (autowire + autoconfigure).

## Call sites

Mount **only** when a real category id exists. Pass **only** `categoryId` (no `|default(null)` shotgun).

### Layout bridge

Core may still pass `categoryId`, `category`, or `breadcrumb`. Normalize to one id, then call:

```twig
{% set id = … %} {# categoryId | category.id | breadcrumb|last.categoryId #}
{% if id %}
    <twig:ViewsTheme:Breadcrumb :categoryId="id" />
{% endif %}
```

## Props

### `Breadcrumb` (class)

| Prop | Default | Notes |
|------|---------|--------|
| `categoryId` | `null` | Required SoT — sales-channel category id |
| `separatorIcon` | `'caret-right'` | `vi_icon` name between items |
| `cva` | `{}` | Deep-merge CVA overrides |

### Derived

| Field | Notes |
|-------|--------|
| `visible` | Trail non-empty |
| `items` | `list<{ name, href, folder, openInNewTab, active }>` |

### `Breadcrumb:Item`

| Prop | Default | Notes |
|------|---------|--------|
| `name` | `null` | Crumb label |
| `href` | `null` | Navigation URL |
| `active` | `false` | Current page (`aria-current="page"`, non-link) |
| `folder` | `false` | Folder category (non-link) |
| `openInNewTab` | `false` | `target="_blank"` when linked |
| `cva` | `{}` | Deep-merge |

## Blocks / nests

| On | Blocks / nests |
|----|----------------|
| Breadcrumb | `root`, `list`, `item`, `separator` |
| Item | `content`, `label`, `plain` |

## Behaviour

- Always builds `BreadcrumbCollection` via core builder (flag off or on)
- URLs via `SeoUrlPlaceholderHandler` → `frontend.navigation.page`
- Separator: `vi_icon(separatorIcon)` between crumbs
- Active and folder crumbs are non-links
- Structured data: leave core JSON-LD meta

## Files

| Role | Path |
|------|------|
| Parent | `components/Breadcrumb.{php,html.twig,cva.twig}` |
| Item | `components/Breadcrumb/Item.{html.twig,cva.twig}` |
| Layout bridge | `storefront/layout/breadcrumb.html.twig` |
