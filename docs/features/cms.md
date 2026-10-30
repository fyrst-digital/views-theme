# CMS layout (sections and blocks)

Theme-owned CMS page layout. Core renders sections and blocks with Bootstrap flexbox (`.row` + `.col-*`). The theme renders the same hierarchy with **CSS grid only**: every layout level is a [`Grid`](grid.md), and every cell spans tracks with `.g-col-*`. No `.row`, no `.col-*`.

## Hierarchy

```text
page/content/detail.html.twig             → Cms:Sections      Grid, one column
  └─ Cms:Section                          section chrome (bg, visibility, pos/type/css classes)
       └─ section/cms-section-default     → Cms:Section:Default   Grid, one column, sizing class
       └─ section/cms-section-sidebar     → Cms:Section:Sidebar   Grid, 1 → 12 tracks from lg
            └─ section/cms-section-block-container → Cms:Block     block chrome (bg, margins, visibility) + Grid
                 └─ block/cms-block-{type}                         Cms:Element × N
                      └─ element/cms-element-{type}                core element, rendered by Cms:Element
```

## Components

| Component | Role |
|-----------|------|
| `Cms:Sections` | Page-level stack. `Grid` `columns="1"` + `.cms-sections` |
| `Cms:Section` | One section's wrapper. Props `section`. Emits `.cms-section pos-{position} cms-section-{type} {cssClass}`, `bg-image` / `bg-color`, `hidden-mobile\|tablet\|desktop`, inline background color / image. Body = `content` block |
| `Cms:Section:Default` | `Grid` `columns="1"`. `sizing` (`container` \| `boxed` \| `full-width`, from `section.sizingMode`) |
| `Cms:Section:Sidebar` | `Grid` `columns="1-lg:12"`, `gap="lg"`. Blocks `sidebar` (`g-col-lg-4 g-col-xl-3`) and `main` (`g-col-lg-8 g-col-xl-9`). `mobileBehavior` `wrap` (default) \| `hidden` (`d-none d-lg-block` on the sidebar) |
| `Cms:Block` | One block's chrome (`.cms-block cms-block-{type} pos-{position}`, background color / media, margins as padding on `.cms-block-container`, visibility) around a `Grid` (`gap="lg"`). `columns` is `1-md:12`; in a sidebar section it is `1-md:12-lg:1` so cells stack beside the narrow column |
| `Cms:Element` | One grid item for a slot's element. Props `block`, `slotName`, `span`, `includeVars`. With `slotName` it sets `data-cms-element-id` and renders `cms-element-{type}` as the default `content`; without `slotName` it is a plain column wrapper whose body the caller fills (blocks that stack several elements). Owns the `span` classes (+ `g-col-lg-1` in a sidebar section). **Renders nothing when its content is blank** |

No PHP / JS / `data-component`. Anonymous UX + `vi_cva`.

## Spans

Block grids have 12 tracks from `md`, one track below. Columns span with `span`:

| `span` | Classes | Used by |
|--------|---------|---------|
| `md:12` | `g-col-md-12` | single-slot blocks (text, image, listing, …) |
| `md:6` | `g-col-md-6` | two-column blocks |
| `md:4` | `g-col-md-4` | three-column blocks |
| `md:3` | `g-col-md-3` | `image-four-column` |
| `md:8` / `md:4` | | `text-teaser-section` |
| `md:9` / `md:3` | | `product-heading` (name / manufacturer logo) |
| `md:12-lg:7` / `md:12-lg:5` | `g-col-md-12 g-col-lg-7`, `g-col-md-12 g-col-lg-5` | `gallery-buybox` |

A span must always carry the `md` step: a `g-col-lg-*` alone would leave the 12-track `md` grid with one-track cells. Below `md` there is one track, so cells need no span and stack. Never use `g-col-12` below `md`.

In a sidebar section the column also gets `g-col-lg-1` (the block grid drops to one track at `lg`). Do not give a `lg` span to a block that can sit in a sidebar.

`image-three-cover` is edge to edge: `Cms:Block` passes `gap: false` for that block type.

## Usage

Block templates stay thin. Override the block's outer Twig block and emit Elements:

```twig
{# storefront/block/cms-block-text-two-column.html.twig #}
{% sw_extends '@Storefront/storefront/block/cms-block-text-two-column.html.twig' %}

{% block block_text_two_column %}
    <twig:ViewsTheme:Cms:Element :block="block" slotName="left" span="md:6" />
    <twig:ViewsTheme:Cms:Element :block="block" slotName="right" span="md:6" />
{% endblock %}
```

Nested columns (several elements in one column) use a body-bearing `Cms:Element` (no `slotName`) around the elements:

```twig
<twig:ViewsTheme:Cms:Element :block="block" span="md:6">
    <twig:ViewsTheme:Cms:Element :block="block" slotName="left-top" class="left-top" />
    <twig:ViewsTheme:Cms:Element :block="block" slotName="left-bottom" class="left-bottom" />
</twig:ViewsTheme:Cms:Element>
```

`includeVars` forwards extra variables to the element include (`gallery-buybox`: `{ startIndexThumbnails: 1, startIndexSlider: 1 }`).

## Storefront bridges

The page, all section, and all 40 core block templates are overridden under `views/storefront/` (the theme renders the whole CMS tree). They are thin: they mount the components above and `sw_include` the next level.

| Template | Mounts |
|----------|--------|
| `page/content/detail.html.twig` | `Cms:Sections` + `Cms:Section` per section (`page_content_sections_inner`) |
| `section/cms-section-default.html.twig` | `Cms:Section:Default` |
| `section/cms-section-sidebar.html.twig` | `Cms:Section:Sidebar` |
| `section/cms-section-block-container.html.twig` | `Cms:Block` |
| `block/cms-block-*.html.twig` | `Cms:Element` per slot (a body-bearing one around stacked elements). `product-three-column` keeps the product-element gate. `app-renderer` replaces the core template (it has no Twig block) |

Block templates `sw_extends` their core template and override the **outer** Twig block only. The inner `block_*_left` / `*_inner` Twig blocks of core are not kept: a `{% block %}` cannot sit inside a `<twig:…>` tag.

## Section layout settings

Admin: section settings in the CMS editor have a collapsible **Layout** group (`extension/sw-cms/sidebar`, override of `sw-cms-sidebar`) with one option, **Gap (px)**, stored per viewport (mobile, tablet, desktop). The field shows only the viewport of the device selected in the editor toolbar (`currentDeviceView`: `mobile` → mobile, `tablet-landscape` → tablet, `desktop` and list view → desktop). An empty field shows the inherited value (the nearest smaller viewport that has one) as its placeholder. Integers `>= 0`; an empty field inherits the next smaller viewport. The admin editor preview does not render it.

| Piece | Detail |
|-------|--------|
| Storage | `cms_section.customFields.viewsTheme.layout.gap = { mobile, tablet, desktop }` (no migration; `cms_section` has `customFields`) |
| Viewports | mobile `< md`, tablet `md` to `< lg`, desktop `>= lg`; widths from `theme_config('breakpoint.md')` / `('breakpoint.lg')` ([Theme breakpoints](../conventions/css-classes.md#theme-breakpoints)) |
| Storefront | `Cms:Section` adds `data-cms-section-id` and, only when a gap is set, a scoped `<style>`: base rule for mobile, then `min-width` rules for tablet / desktop. Mobile-first, so the cascade does the inheritance |
| Token | `--vi-cms-section-gap` on the section wrapper. `Cms/Section.css` reads it on `Cms:Section:Default` (fallback `0`) and `Cms:Section:Sidebar` (fallback `24px`); both Grids use `gap="custom"` |

Values are sanitised in `Section.html.twig` (numeric only, clamped to `>= 0`, emitted as `px`). The `<style>` relies on the shop CSP allowing inline styles.

## Empty content

A block with no output is not rendered at all: `Cms:Block` renders its body first and emits nothing (no wrapper, background, padding or grid) when it is blank after `|trim`. The same rule applies one level down: `Cms:Element` emits nothing when its content is blank (e.g. `cross-selling` without cross-sellings, `sidebar-filter` without filters). A block therefore disappears when all of its elements are empty. Elements that render a visible-but-empty wrapper still count as content.

## Core class names

The theme keeps the semantic hooks that core SCSS and plugins rely on: `cms-sections`, `cms-section`, `cms-section-{type}`, `cms-section-default`, `cms-section-sidebar` (+ `-sidebar-content`, `-main-content`, `-mobile-{wrap|hidden}`), `cms-block`, `cms-block-{type}`, `cms-block-container`, `cms-block-container-row`, `boxed`, `full-width`, `bg-image`, `bg-color`, `hidden-*`, `product-detail-media`, `product-detail-buy`. Gone: `row`, `cms-row`, `col-*`, `has--sidebar`.

## Limitations

- **Plugin / app blocks** that still emit `<div class="col-md-N">` inside the block row are not laid out as columns. Port them to `Cms:Element`.
- Core `_cms-block.scss` rules keyed on `.row` / `[class^='col-']` (e.g. `.cms-block-image-three-cover`) now match nothing and are harmless.
- `product-heading` is a 9 / 3 split. Core sized the manufacturer logo with `col-md-auto`.
- Gutters: `gap-6` replaces core's 40px column gutter, and its row spacing replaces the `margin-bottom` rules of `_cms-block.scss` for stacked columns.

## Related

- [Grid](grid.md)
- [Product reviews](review.md) (`Cms:DescriptionReviews`)
- [Gallery](gallery.md)

## Files

`components/Cms/{Sections,Section,Block,Element}.{html.twig,cva.twig}` · `components/Cms/Section.css` · `administration/src/extension/sw-cms/sidebar/*` · `theme.json` (`sw-breakpoint-*`) · `components/Cms/Section/{Default,Sidebar}.*` · `storefront/page/content/detail.html.twig` · `storefront/section/*` · `storefront/block/*`
