# CSS class API

## Current standard (UX)

Components use **[`vi_cva`](../twig/vi-cva.md)** / **`vi_cva_from_file`** + attributes.

| Concern | Mechanism |
|---------|-----------|
| Default CVA config | Sibling `Name.cva.twig` via `vi_cva_from_file(cva)`, or inline map for small components |
| Caller CVA override | `:cva="{ … }"` deep-merged into defaults |
| Root extra classes | `class="…"` on the component tag |
| Nested slot extras | `slot:class="…"` |
| Composition | `{% set cx = vi_cva_from_file(cva) %}` or `vi_cva({ … }\|replace_recursive(cva))` then `cx.root.apply({ … })` |

Root BEM: `vi-*` prefix + utilities in slot `base`.

- **Bootstrap** utilities: `d-flex`, `gap-2`, `p-3`, … (existing CVA)
- **Tailwind** utilities: always `tw:`-prefixed (`tw:flex`, `tw:lg:gap-4`) so they never collide with Bootstrap

Prefer one system per property on a node (do not mix e.g. `gap-2` and `tw:gap-4` on the same element). Global component overrides/tokens: Tailwind-built `assets/css/theme.css` (source: `app/storefront/src/css/`). See [Configuration — Tailwind CSS](../configuration.md#tailwind-css-themecss).

Always call `vi_cva` / `vi_cva_from_file` **before** rendering `attributes` / `attributes.defaults()`.

**Never** put `class` / `slot:class` inside `.defaults({…})` — use `class="{{ cx.…apply() }}"` (or `slot:class="…"`) on the tag. See [UX components — Attributes](ux-components.md#attributes).

## CSS custom properties (critical)

Co-located component CSS (`components/**/*.css`) and theme CSS have **different** jobs for custom properties.

| Layer | Role |
|-------|------|
| **Component CSS** | Structure + **consume** tokens with a **fallback default** only |
| **Theme CSS** (`app/storefront/src/css/components.css` → `theme.css`) | **Assign** tokens to override component defaults |

### Component CSS — never assign tokens

**Never** define a custom property on a selector in component CSS. Defaults live only as the second argument to `var()`.

```css
/* ❌ NEVER — explicit token assignment in component CSS */
.vi-language-action {
  --language-flag-width: 1.25rem;
  --dropdown-max-width: min(100vw - 1.5rem, 16rem);
}
.vi-language-action__flag-icon {
  width: var(--language-flag-width);
}

/* ✅ ALWAYS — consume with fallback */
.vi-language-action {
  min-width: var(--language-action-min-width, 10rem);
}
.vi-language-action__flag-icon {
  width: var(--language-flag-width, 1.25rem);
  border-radius: var(--language-flag-radius, 0.125rem);
}
```

Reference: `Dropdown.css` uses `max-width: var(--dropdown-max-width, min(100vw - 1.5rem, 22rem))`.

### Theme CSS — assign to override

Theme (and other callers) may set tokens on a host/class so component rules pick them up:

```css
/* ✅ theme override */
.vi-language-action,
.vi-currency-action {
  --dropdown-max-width: min(100vw - 40px, 16rem);
}
.vi-account__dropdown {
  --dropdown-max-width: min(100vw - 40px, 280px);
}
```

### When to use a `.cva.twig` file

Prefer a sibling file when the map has many slots, variants, or hurts template readability. Keep a 2–3 slot static map inline if clearer.

```text
Alert.html.twig
Alert.cva.twig      # hash expression only
```

## Removed legacy API

`vi_define_classes`, `vi_attr_classes`, `vi_classes`, and root props `defaultBaseClasses` / `defaultVariants` have been **removed**. Do not reintroduce them.

Historical docs (for reference only):

- [vi_define_classes](../twig/vi-define-classes.md)
- [vi_attr_classes](../twig/vi-attr-classes.md)
- [vi_classes](../twig/vi-classes.md)

## Related

- [`vi_cva`](../twig/vi-cva.md)
- [UX components](ux-components.md)
- [Component templates](components.md)
