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

**Never** put `class` / `slot:class` inside `.defaults({…})` — use `class="{{ cx.…apply() }}"` (or `slot:class="…"`) on the tag. See [UX components — Attributes](ux-components.md#attributes).

## CSS custom properties (critical)

Co-located component CSS (`components/**/*.css`) and theme CSS have **different** jobs for custom properties.

| Layer | Role |
|-------|------|
| **Component CSS** | Structure + **consume** tokens with a **fallback default** only (`prop: var(--vi-*, fallback)`). No Bootstrap/Shopware override dumps |
| **SCSS** (`app/storefront/src/scss/`) | Bootstrap / Shopware quirks and theme layout overrides (e.g. `_form.scss`, `component/filter.scss`) |
| **Theme CSS** (`app/storefront/src/css/components.css` → `theme.css`) | **Assign** tokens to override component defaults |

### Component CSS — never assign tokens

**Never** define a custom property on a selector in component CSS. Defaults live only as the second argument to `var()`.

```css
/* ❌ NEVER — explicit token assignment in component CSS */
.vi-language-action {
  --vi-flag-w: 1.25rem;
  --vi-max-w: min(100vw - 1.5rem, 16rem);
}
.vi-language-action__flag-icon {
  width: var(--vi-flag-w);
}

/* ✅ ALWAYS — consume with fallback */
.vi-language-action {
  min-width: var(--vi-min-w, 10rem);
}
.vi-language-action__flag-icon {
  width: var(--vi-flag-w, 1.25rem);
  border-radius: var(--vi-flag-radius, 0.125rem);
}
```

Reference: `Dropdown.css` uses `max-width: var(--vi-max-w, min(100vw - 1.5rem, 22rem))`.

### Theme CSS — assign to override

Theme (and other callers) may set tokens on a host/class so component rules pick them up:

```css
/* ✅ theme override */
.vi-language-action,
.vi-currency-action {
  --vi-max-w: min(100vw - 40px, 16rem);
}
.vi-account__dropdown {
  --vi-max-w: min(100vw - 40px, 280px);
}
```

### Token naming

Prefer **short** `--vi-*` names. The host selector scopes the token — do not encode the full component path.

| Kind | Pattern | Examples |
|------|---------|----------|
| Shell / motion (theme-facing) | `--vi-{shell}-{property}` | `--vi-drawer-duration`, `--vi-flyout-offset`, `--vi-menu-duration` |
| Local layout on a host | `--vi-{property}` | `--vi-image-size`, `--vi-max-w`, `--vi-fade`, `--vi-min-w` |
| CSS anchors (`anchor-name`) | `--vi-{element}` | `--vi-navigation-bar`, `--vi-header-main` (identity; not theme knobs) |

```css
/* ❌ long / unprefixed path in the name */
--vi-navigation-drawer-item-image-aspect-ratio
--language-flag-aspect-ratio
--dropdown-max-width

/* ✅ short; set on the host */
.vi-navigation-drawer-item__image { width: var(--vi-image-size, 1.75rem); }
.vi-dropdown[popover] { max-width: var(--vi-max-w, min(100vw - 1.5rem, 22rem)); }
.vi-navigation-drawer-menu { --vi-menu-duration: 300ms; /* theme assign */ }
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
