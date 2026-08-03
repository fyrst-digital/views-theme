# Filter layout via CVA props (replace drawer SCSS)

## Problem

`app/storefront/src/scss/component/filter.scss` hardcodes `#vi-filter-drawer` descendant overrides (column stack, `display: block` hosts, full-width toggles, accordion body sizing). That fights component CVA defaults (`d-contents`, chip bar, popover shell) instead of expressing **bar vs drawer** as first-class component API.

## Goal

One shared layout prop, pure CVA variants on the affected slots, cascade from `Filter:Drawer` → `Filter:Panel` → facets → Group/Toggle. Delete `filter.scss`. Align Group JS accordion mode with the same prop (no `#vi-filter-drawer` DOM sniff).

## Prop API

| Prop | Values | Default | Owner |
|------|--------|---------|--------|
| `layout` | `bar` \| `stacked` | `bar` | Panel + every facet + Group + Toggle |

- Desktop bridge / SSR Panel: omit prop → `bar`
- `Filter:Drawer` passes `layout="stacked"` into `Filter:Panel`
- Panel injects layout into each facet:  
  `component(facet.component, facet.props|merge({ layout: layout }))`
- Facets pass `layout` into `Filter:Group`; Group into `Filter:Group:Toggle`

Do **not** push layout through `FilterFacetResolver` (presentation, not aggregation data).

## CVA variants (by slot)

### `Filter:Panel`

| Slot | `bar` | `drawer` |
|------|-------|----------|
| `items` | keep `d-flex flex-wrap align-items-center gap-2` | `d-flex flex-column align-items-stretch gap-2` |

```twig
class="{{ vi_class('items', { layout: layout }) }}"
```

`Panel.php`: add `public string $layout = 'bar';` (class component — no `{% props %}`).

### Facet hosts — `Boolean`, `MultiSelect`, `Range`, `Rating`

| Slot | `bar` | `drawer` |
|------|-------|----------|
| `root` | `d-contents` | `d-block` (or `d-block w-100`) |

### `Boolean` chip / `Group:Toggle` root

| Slot | `bar` | `drawer` |
|------|-------|----------|
| `chip` / Toggle `root` | current inline chip utilities | add `w-100 justify-content-between` |

### Popover body — `MultiSelect` / `Range` / `Rating` (`body`, `content`)

| Slot | `bar` | `drawer` |
|------|-------|----------|
| `body` | keep `shadow` (+ existing `bg-body border rounded`) | `w-100 shadow-none` (no popover chrome) |
| `content` | base only | no extra if CSS is scoped (below) |

Apply variants at use site: `vi_class('root'|'body'|'content'|…, { layout: layout })`.

Shared body/footer/reset strings stay duplicated per facet CVA (no extract unless you want a follow-up).

## Markup: stop emitting popover chrome in drawer

Today Twig always sets `popover` / `position-anchor` / Toggle `popovertarget`; Group.js strips them when inside `#vi-filter-drawer`. Prefer **not rendering** bar-only attrs when `layout == 'drawer'`:

| Location | `bar` only |
|----------|------------|
| Facet body | `popover="auto"`, `data-placement`, `style="position-anchor: …"` |
| `Group` → Toggle defaults | `style: 'anchor-name: …'` |
| `Group:Toggle` | `popovertarget`, `aria-haspopup="dialog"` |

Drawer still uses `aria-expanded` + accordion click (Group JS).

## `Filter:Group` JS

Replace drawer sniff with options:

```js
static options = {
  open: false,
  layout: 'bar', // 'bar' | 'drawer'
  // remove drawerSelector
}
```

```js
this._accordion = this.options.layout === 'drawer'
```

Group template:

```twig
'data-component-options': { open: open, layout: layout }|json_encode
```

## Component CSS tweak (`Group.css`)

Popover sizing already lives under `.vi-filter-group-body[popover]`. Move content scrollport under the same guard so drawer bodies do not need a max-height utility war:

```css
/* today — always */
.vi-filter-group-body__content {
  max-height: var(--vi-content-max-h, min(50vh, 20rem));
}

/* target — popover only */
.vi-filter-group-body[popover] .vi-filter-group-body__content {
  max-height: var(--vi-content-max-h, min(50vh, 20rem));
}
```

(Or nest `__content` inside the existing `[popover]` block.) Token consume + fallback only — no token assignment.

## Delete theme SCSS override

1. Delete `src/Resources/app/storefront/src/scss/component/filter.scss`
2. Remove `@import 'component/filter';` from `base.scss`
3. Drop `filter.scss` mentions from `docs/features/filters.md` and `docs/conventions/css-classes.md` (keep `_form.scss` — still valid for Switch)

## Files to touch

| Area | Files |
|------|--------|
| Cascade | `Filter/Drawer.html.twig`, `Filter/Panel.{php,html.twig,cva.twig}` |
| Facets | `Filter/{Boolean,MultiSelect,Range,Rating}.{html.twig,cva.twig}` |
| Group | `Filter/Group.{html.twig,js,css}`, `Filter/Group/Toggle.{html.twig,cva.twig}` |
| SCSS | delete `filter.scss`, edit `base.scss` |
| Docs | `docs/features/filters.md` (layout prop, CSS architecture table, remove SCSS row) |

## Out of scope

- Changing facet resolution / listing control contract
- Visual redesign beyond bar vs drawer layout parity
- Extracting shared “group body” CVA partial
- Running theme/JS builds (human verifies)

## Verification (human)

1. Desktop (`lg+`): horizontal chip bar, popovers + anchor, Boolean chip inline
2. Mobile drawer open: column stack, full-width toggles, accordion expand/collapse, no popover flash
3. Drawer close unmount + `syncControls` still works
4. No leftover rules targeting `#vi-filter-drawer` for layout
