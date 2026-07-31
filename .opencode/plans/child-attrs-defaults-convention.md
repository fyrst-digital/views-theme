# Plan: Prefer nest + defaults for child mounts

## Goal

Lock the convention that overridable child `<twig:…>` mounts use **only**:

```twig
class="{{ cx.slot.apply() }}"
{{ ...attributes.nested('slot').defaults({ … }).all() }}
```

— not hardcoded `:prop` alongside (or instead of) the same keys. Document nested colon keys in defaults (`'button:label': false`). Clean known hybrid call sites. Keep stated exceptions.

## Decisions (confirmed)

| Choice | Value |
|--------|--------|
| Scope | **Docs + hybrid cleanup** |
| Exceptions | **OK** — loops, sealed leaves, root-level `attributes.defaults` (no nest), CVA/`slot:class` on the tag |
| Nested chrome in defaults | Yes — e.g. `'button:label': false` |

## Canonical pattern

```twig
{# ✅ preferred — domain props + nested child props in one defaults hash #}
<twig:ViewsTheme:Product:Action:Buy
    class="{{ cx.buy.apply() }}"
    {{ ...attributes.nested('buy').defaults({
        product: product,
        showQuantity: showQuantity,
        'button:label': false,
    }).all() }}
/>
```

```twig
{# ❌ avoid on overridable children #}
:product="product"
:showQuantity="showQuantity"
:button:label="false"
{{ ...attributes.nested('buy').all() }}
```

**Rules (short):**

- `class` / `slot:class` (CVA) stay on the tag — never inside `.defaults({…})`.
- Non-class child inputs (props + deeper nests like `button:label`) go in `.defaults({…})`.
- Nested keys with `:` must be **quoted** in the Twig hash; non-strings use real values (`false`, not `'false'`).
- Caller wins: `buy:showQuantity`, `buy:button:label`, etc.
- Do not duplicate the same key as both a tag attr and a defaults entry.

**Exceptions (unchanged intent):**

| Case | Pattern |
|------|---------|
| Loop / per-item data | Hardcoded `:item="child"` etc. is fine |
| Sealed leaf (no public nest API) | Hardcoded props only; no `nested('…')` |
| Root host wrapper (child *is* the component root) | `{{ ...attributes.defaults({…}).all() }}` without `nested()` |
| Nested CVA classes | `label:class="{{ classes.label }}"` / `icon:class="…"` on the tag |

---

## 1. Docs

### `docs/conventions/ux-components.md` — § Attributes / Child components

Update the child-forward section to:

1. State **defaults-only** as the preferred (and default) pattern for overridable children — not “prefer over long prop lists” alone; explicitly disprefer hardcoded `:prop` + bare `nested(…).all()`.
2. Keep the Form:Input / Login example.
3. **Add** a Product Buy-style example showing nested colon keys:

```twig
<twig:ViewsTheme:Product:Action:Buy
    class="{{ cx.buy.apply() }}"
    {{ ...attributes.nested('buy').defaults({
        product: product,
        showQuantity: showQuantity,
        'button:label': false,
    }).all() }}
/>
```

4. Bullet list:
   - Quoted nested keys: `'button:label': false`
   - Caller override: `:buy:button:label="true"` / `buy:buyLabel="…"`
   - `class` never in defaults
   - Inline `nested` + inline defaults hash (existing rules)
5. Replace soft “Skip spread only when fixed” with a tight **Exceptions** subsection (loops / sealed / root `attributes.defaults` / tag `slot:class`).

### `docs/conventions/components.md`

Tighten checklist item 4 to match: overridable child → defaults pattern only; link to ux-components § Attributes. One line on nested keys in defaults if space allows.

### Feature docs (light touch)

Only if a feature page documents child override API and still shows hardcoded props — align example to defaults. Primary candidate if present: `docs/features/product-box.md` (Buy/Detail nesting). Skip pages with no child-attr examples.

### Out of scope for docs

- No new hard-rules checklist row (topic already under ux-components).
- No `vi_forward` helper docs.
- No AGENTS.md prose.

---

## 2. Hybrid cleanup (code)

Move explicit domain props into `.defaults({…})`; leave `class` / `*:class` on the tag.

| File | Nest | Move into defaults |
|------|------|-------------------|
| `Product/Box/Actions.html.twig` | `buy` / `detail` | **Already clean** (reference; include `'button:label': false`) — verify only |
| `Product/Actions.html.twig` | `buy` / `detail` | Already defaults; optional add nothing unless product wants button defaults later |
| `Page/Header/Main.html.twig` | `navigation` | `navigation`, `navigationDepth`, `widthAnchor` |
| `Navigation/Flyout.html.twig` | `teaser` | `category`, `image` (`teaserImage`) |
| `Language/Menu.html.twig` | `flagIcon` | `src`, `fallbackSrc` |
| `Navigation/Drawer/Menu.html.twig` | `header` | `category` (`active`), `menuUrl` |
| `Navigation/Drawer/Menu/Header.html.twig` | `back`, `showAll`, `active` | `showLabel`, `category`, `menuUrl` as applicable; keep `icon:class` / `class` on tag |

**Search pass after edits:** re-grep for `:prop` immediately above/below `...attributes.nested(` and fix any remaining hybrids that are not exceptions.

**Do not touch:**

- Loop mounts (`Navigation/Flyout/Item`, `Column`, `VariantsGrid/Rows`, …)
- Pure sealed children without nest
- Root spreads like `Wishlist/Action` → `...attributes.defaults({…}).all()`
- Intentional `...attributes` full-bag forward (`LineItem.html.twig` type switch) unless it is clearly a nest hybrid

**Note:** `Language/Action` / `Currency/Action` use `...attributes.defaults({…}).without('class')` on Dropdown — root-style host, not nest hybrid; leave unless an obvious nested child hybrid appears inside.

---

## 3. Verification

- Visual/template review of edited Twig (no build — per agent-workflow).
- Grep: no `:foo=` + `nested('…').all()` without `.defaults` for the cleaned files.
- Docs render sanity (markdown links still valid).

---

## Implementation order

1. Update `ux-components.md` (canonical + nested-key example + exceptions).
2. Update `components.md` checklist line.
3. Hybrid cleanup files (table above).
4. Light feature-doc example fix if needed.
5. Grep verification.

## Non-goals

- Mass conversion of every hardcoded child in the tree
- New Twig helpers
- Changing runtime/PHP `ComponentAttributes` behavior
- Build / theme compile
