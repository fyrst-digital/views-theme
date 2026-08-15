# CSS class API

## Current standard (UX)

Components use **[`vi_define_cva` / `vi_class`](../twig/vi-cva.md)** + attributes.

| Concern | Mechanism |
|---------|-----------|
| Default CVA config | Sibling `Name.cva.twig` via `vi_define_cva(cva)`, or inline map for small components |
| Caller CVA override | `:cva="{ … }"` deep-merged into defaults |
| Root extra classes | `class="…"` on the component tag |
| Nested slot extras | `slot:class="…"` |
| Composition | `{% do vi_define_cva(cva) %}` then `vi_class('root', { … })` ([vi-cva](../twig/vi-cva.md)) |

Root BEM: `vi-*` prefix + utilities in slot `base`.

- **Bootstrap** utilities: `d-flex`, `gap-2`, `p-3`, … (existing CVA)
- **Tailwind** utilities: always `tw:`-prefixed (`tw:flex`, `tw:lg:gap-4`) so they never collide with Bootstrap

Prefer one system per property on a node (do not mix e.g. `gap-2` and `tw:gap-4` on the same element). Global component overrides/tokens: Tailwind-built `assets/css/theme.css` (source: `app/storefront/src/css/`). See [Configuration — Tailwind CSS](../configuration.md#tailwind-css-themecss).

Always call `vi_define_cva` **before** rendering `attributes` / `attributes.defaults()`.

**Never** put `class` / `slot:class` inside `.defaults({…})` — use `class="{{ vi_class('…') }}"` (or `slot:class="…"`) on the tag. See [UX components — Attributes](ux-components.md#attributes).

## CVA vs component CSS (critical)

CVA is the **variant API**, not a bag for a BEM root. Check CVA first. Component CSS is only for structure Bootstrap cannot express.

### Decision order

1. Does a **Bootstrap utility** exist? → CVA (`base` / `variants` / `compoundVariants`).
2. Does it change with a **component prop** (`layout`, `size`, `color`)? → `variants`. Two axes at once → `compoundVariants`.
3. Does it change only at a **theme breakpoint**? → responsive utility (`d-xl-contents`, `position-xl-sticky`). Never invent `1280px`.
4. Else → component CSS token (`--vi-*`).

| CVA | CSS token |
|-----|-----------|
| `display`, `flex`/`grid` chrome, `gap`, `align-*`, `justify-*`, `margin`/`padding`, `font-size`/`fw`, visibility (`d-none` / `d-xl-block`) | Custom `grid-template-columns` / `grid-template-areas` |
| Prop axes (`layout: stacked \| grid`) | `grid-column: 1 / -1`, `span 2`, column index |
| Breakpoint chrome (`d-xl-*`, `align-items-xl-center`) | px size with no utility (`--vi-image-size`, `--vi-top`) |
| | Inherited geometry a parent must set (`--vi-cols` on `Cart:Items`) |

### Theme breakpoints

SoT: `src/Resources/app/storefront/src/scss/override.scss` (`$grid-breakpoints`).

| Token | Width |
|-------|-------|
| `sm` | 520px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | **1260px** |
| `xxl` | 1600px |

Desktop storefront chrome uses **`xl`**, not `1280px`. Display utilities include `contents` (`d-contents`, `d-xl-contents`). Spacers `0–10` (`gap-6` = 24px). Position is responsive (`position-xl-sticky`).

### Variants vs tokens

```twig
{# ✅ CVA — layout + xl chrome #}
root: {
    variants: {
        layout: {
            stacked: 'd-grid gx-3 gy-2 align-items-start',
            grid: 'd-contents',
        },
    },
},
footer: {
    variants: {
        layout: {
            stacked: 'd-flex align-items-center gap-2',
            grid: 'd-flex d-xl-contents align-items-center gap-2',
        },
    },
}
```

```css
/* ✅ CSS — custom tracks / span only */
.vi-cart-items[data-layout='grid'] {
  grid-template-columns: var(--vi-cols, var(--vi-image-size, 80px) minmax(0, 1fr));

  @media (min-width: 1260px) {
    --vi-cols: var(--vi-image-size, 80px) minmax(0, 1fr) minmax(104px, auto) auto minmax(72px, auto) minmax(80px, auto);
    --vi-span: span 2;
  }
}

/* ❌ NEVER — wrap a utility in a token */
.vi-line-item__unit-price {
  display: var(--vi-unit-d, none);
}
@media (min-width: 1280px) {
  --vi-unit-d: block;
  --vi-col-gap: 16px;
}
```

```twig
{# ❌ same mistake as CVA base-only + CSS token #}
root: { base: 'vi-line-item__unit-price' }

{# ✅ #}
root: { base: 'vi-line-item__unit-price d-none d-xl-block' }
```

`compoundVariants` when **two props** must combine (`size` + `color`, `pill` + `size`). A breakpoint switch is **not** a compound axis — use `d-xl-*`.

### Bootstrap names only

This theme’s utilities are Bootstrap (see `override.scss`). Do **not** invent Tailwind aliases in CVA.

| Use | Not |
|-----|-----|
| `flex-shrink-0` | `shrink-0` |
| `d-block` | `block` |
| `width` / `height: var(--vi-image-size, 80px)` | `w-20` `h-20` |
| `tw:…` only when Tailwind is required | unprefixed Tailwind |

## Length units (critical)

Theme-owned **component CSS** and **token fallbacks / theme assigns** use **`px` only** for lengths.

| OK | Not OK |
|----|--------|
| `px`, `%`, `vh` / `vw`, unitless `line-height`, `calc()` of those | `rem`, `em` for sizes, gaps, radii, offsets, token fallbacks |

Bootstrap **utility classes** are fine (their internal scale is Bootstrap’s). Do not author new `rem`/`em` lengths in `components/**/*.css` or when assigning `--vi-*` in theme CSS.

```css
/* ✅ */
width: var(--vi-thumb-size, 20px);
max-width: var(--vi-max-w, min(100vw - 24px, 352px));

/* ❌ */
width: var(--vi-thumb-size, 1.25rem);
max-width: var(--vi-max-w, min(100vw - 1.5rem, 22rem));
```

## CSS custom properties (critical)

Co-located component CSS (`components/**/*.css`) and theme CSS have **different** jobs for custom properties.

| Layer | Role |
|-------|------|
| **Component CSS** | Structure **CVA cannot own** ([above](#cva-vs-component-css-critical)): **init** each varying prop once as `prop: var(--vi-*, fallback)`. Variants/states **assign** `--vi-*` only — never re-declare the property with a new fallback. Nest variants on the host (`&[aria-*]`, `&:last-child`, `&[data-*]`). No Bootstrap/Shopware override dumps |
| **SCSS** (`app/storefront/src/scss/`) | Bootstrap / Shopware quirks and theme layout overrides (e.g. `_form.scss`) |
| **Theme CSS** (`app/storefront/src/css/components.css` → `theme.css`) | **Assign** tokens to override component defaults from outside |

### Init once, assign on variants

Defaults live only as the second argument to `var()` on the base rule. Do **not** assign tokens as defaults on the base selector. Variants (`[data-*]`, media, state) override by **assigning** the token — not by re-declaring the CSS property.

```css
/* ❌ NEVER — default assign on base (use var fallback instead) */
.vi-language-action {
  --vi-flag-w: 20px;
  --vi-max-w: min(100vw - 24px, 256px);
}
.vi-language-action__flag-icon {
  width: var(--vi-flag-w);
}

/* ❌ NEVER — re-declare property with a different fallback on a variant */
.vi-gallery {
  min-block-size: var(--vi-min-h, auto);

  &[data-mode='fullscreen'] {
    min-block-size: var(--vi-min-h, 0);
  }
}

/* ✅ ALWAYS — init once with fallback; variant assigns token only */
.vi-gallery {
  min-block-size: var(--vi-min-h, auto);
  grid-template-rows: var(--vi-rows, none);

  &[data-mode='fullscreen'] {
    --vi-min-h: 0;

    &[data-multi='true'] {
      --vi-rows: minmax(0, 1fr) auto;
    }
  }
}

.vi-language-action {
  min-width: var(--vi-min-w, 160px);
}
.vi-language-action__flag-icon {
  width: var(--vi-flag-w, 20px);
  border-radius: var(--vi-flag-radius, 2px);
}
```

Reference: `Dropdown.css` uses `max-width: var(--vi-max-w, min(100vw - 24px, 352px))`. Gallery host (`Gallery.css`) is the SoT for orientation + mode token assigns.

### Theme CSS — assign to override

Theme (and other callers) may set tokens on a host/class so component rules pick them up:

```css
/* ✅ theme override (px) */
.vi-language-action,
.vi-currency-action {
  --vi-max-w: min(100vw - 40px, 256px);
}
.vi-account__dropdown {
  --vi-max-w: min(100vw - 40px, 280px);
}
```

### Token naming

Custom properties **inherit**. A host class does **not** isolate a generic name. `--vi-color` on Accordion picks up a parent `--vi-color`.

| Kind | Pattern | Examples |
|------|---------|----------|
| **Component chrome / motion** (color, fw, bg, duration) | `--vi-{component}-{prop}` | `--vi-tab-color`, `--vi-accordion-fw`, `--vi-drawer-duration` |
| Shared geometry on a host | `--vi-{prop}` | `--vi-max-w`, `--vi-image-size`, `--vi-fade` |
| CSS anchors (`anchor-name`) | `--vi-{element}` | `--vi-navigation-bar`, `--vi-header-main` (identity; not theme knobs) |

**Never** generic look/motion names: `--vi-color`, `--vi-fw`, `--vi-bg`, `--vi-duration`, `--vi-active-color`.  
**Never** the full component path: `--vi-accordion-header-active-background-color`.  
Keep names short: `--vi-accordion-color`, not `--vi-accordion-header-color`.

```css
/* ❌ generic — inherits / collides */
.vi-accordion__header {
  color: var(--vi-color, var(--tertiary-color));
}

/* ❌ full path */
--vi-accordion-header-active-background-color
--language-flag-aspect-ratio
--dropdown-max-width

/* ✅ component chrome prefix (Tabs / Accordion / Drawer) */
.vi-tabs__tab {
  --nav-link-color: var(--vi-tab-color, var(--tertiary-color));
}
.vi-accordion__header {
  color: var(--vi-accordion-color, var(--tertiary-color));
}
.vi-navigation-drawer-menu { --vi-menu-duration: 300ms; /* theme assign */ }

/* ✅ shared geometry — name is already specific */
.vi-navigation-drawer-item__image { width: var(--vi-image-size, 28px); }
.vi-dropdown[popover] { max-width: var(--vi-max-w, min(100vw - 24px, 352px)); }
```

Do **not** rename design-system / Bootstrap APIs (`--bs-*`, `--btn-*`, `--badge-*`, `--sw-*`, `--spacing-*`, …).

### When to use a `.cva.twig` file

Prefer a sibling file when the map has many slots, variants, or hurts template readability. Keep a 2–3 slot static map inline if clearer.

```text
Alert.html.twig
Alert.cva.twig      # hash expression only
```

## Removed legacy API

Legacy pre-UX class-map APIs are **removed**. Current API: [`vi_define_cva` / `vi_class`](../twig/vi-cva.md).

Historical docs (for reference only):

- [vi_define_classes](../twig/vi-define-classes.md)
- [vi_attr_classes](../twig/vi-attr-classes.md)
- [vi_classes](../twig/vi-classes.md)

## Related

- [`vi_define_cva` / `vi_class`](../twig/vi-cva.md)
- [UX components](ux-components.md)
- [Component templates](components.md)
