# Plan: Pre-bind nested attributes via `attrs` map

## Goal

Adopt a root-level **`attrs`** map (sibling of **`classes`**) for all nested attribute bags, so nests stay correct under deep UX composition and stay consistent on flat shells.

```twig
{% set cx = vi_cva_from_file(cva) %}
{% set classes = {
    root: cx.root.apply(),
    buy: cx.buy.apply(),
} %}
{% set attrs = {
    buy: attributes.nested('buy'),
    detail: attributes.nested('detail'),
} %}

<div {{ attributes }} class="{{ classes.root }}">
    <twig:ViewsTheme:Product:Action:Buy
        class="{{ classes.buy }}"
        {{ ...attrs.buy.defaults({
            product: product,
            showQuantity: showQuantity,
            'button:label': false,
        }).all() }}
    />
</div>
```

## Decisions (confirmed)

| Topic | Decision |
|-------|----------|
| Flat shells (e.g. `Product:Actions`) | **Still use `attrs`** for consistency (not only when shadowing is possible) |
| When to build the map | **After** `vi_cva` / `vi_cva_from_file` (so slot `class` stripping has run) |
| What to store | **Bags** (`attributes.nested('slot')`), not `.all()` / not pre-applied defaults |
| Defaults | Still **at the mount/DOM site**: `attrs.slot.defaults({ … })` — hash stays inline |
| Own root | Keep `{{ attributes }}` / `attributes.defaults({ … })` — not via `attrs` |
| Name | **`attrs` only** — never shadow UX `attributes` |
| Replace | One-off `parentAttributes` (PromotionForm) → `attrs.submit` etc. |

## Why

Inside a nested host’s `<twig:block>`, `attributes` is the **child** bag. Inline `attributes.nested('submit')` then reads the wrong bag. Pre-binding (like `classes`) fixes that and documents the public nest surface at the top of the template.

Docs today say “call `nested` inline — no intermediate variable” — that rule is **inverted** by this plan.

---

## Canonical rules (docs)

### Build

```twig
{% set cx = vi_cva_from_file(cva) %}   {# or vi_cva #}
{% set classes = { … } %}             {# when multi-slot / host blocks — existing rule #}
{% set attrs = {
    slotA: attributes.nested('slotA'),
    slotB: attributes.nested('slotB'),
} %}
```

- Keys = nest names (parent public API).
- Include **every** nest used in the template (DOM or child).
- Optional empty bag is fine: `close: attributes.nested('close')` then `attrs.close.defaults({}).all()`.

### Use

| Target | Pattern |
|--------|---------|
| Overridable child `<twig:…>` | `class="{{ classes.slot }}"` (or `cx…` if single-slot) + `{{ ...attrs.slot.defaults({ … }).all() }}` |
| Own DOM node | `{{ attrs.slot }}` / `{{ attrs.slot.defaults({ … }) }}` + `class="{{ … }}"` |
| Own root | `{{ attributes }}` / `{{ attributes.defaults({ … }) }}` |
| Inside nested `<twig:block>` | **Must** use `attrs.*` / `classes.*` — never bare `attributes` / `cx` for parent data |

### Still true (unchanged)

- No `class` in `.defaults({…})`
- Nested prop keys quoted: `'button:label': false`
- No hardcoded `:prop` beside the same nest defaults
- Defaults hash inline at call site
- Exceptions: loops / sealed leaves / root host wrapper / tag `slot:class`

### Doc hint (flat shells)

> Technically, flat sibling mounts on the component’s own root do not shadow `attributes`. Prefer the `attrs` map **anyway** so every component has one nest API shape and is safe if a host is introduced later.

### Anti-patterns

```twig
{# ❌ bare nest at use site (no attrs map) #}
{{ ...attributes.nested('buy').defaults({…}).all() }}

{# ❌ parentAttributes alias #}
{% set parentAttributes = attributes %}

{# ❌ defaults baked into attrs map (harder to use locals; mixed types) #}
{% set attrs = { buy: attributes.nested('buy').defaults({…}).all() } %}

{# ❌ attrs before vi_cva #}
{% set attrs = { buy: attributes.nested('buy') } %}
{% set cx = vi_cva_from_file(cva) %}
```

---

## Implementation phases

### Phase 1 — Docs only

**Files:**

- `docs/conventions/ux-components.md`
  - § Attributes table: child + DOM nest rows → `attrs.slot…`
  - Remove “inline nested only / no intermediate”
  - Rewrite § Child components examples to `classes` + `attrs`
  - Extend § Nested blocks shadowing: `attributes` + `attrs` next to `cx` + `classes`
  - Flat-shell consistency note
  - Update Drawer header / any other nested examples in the same file
- `docs/conventions/components.md` — checklist item 4 → attrs map
- Light feature-doc touches only where examples show bare `attributes.nested` for child forward (e.g. form-input / product-box / cart if needed)

**Do not** change hard-rules checklist structure unless a new link anchor is required (topic stays ux-components).

### Phase 2 — Child spreads + known shadowing (high value)

Convert every `{{ ...attributes.nested(...)` (and `parentAttributes.nested`) to `attrs`.

**Priority files (non-exhaustive; grep is source of truth):**

| Area | Files |
|------|--------|
| Product | `Product/Actions`, `Product/Box/Actions`, `Product/Action/Buy`, `Product/Box*`, `Product/Box.html.twig`, `Product/Badges` |
| Cart | `Cart/PromotionForm` (**drop `parentAttributes`**), `Cart/Actions`, `Cart/Options`, `Cart/Drawer*`, `Cart/ShippingCalculation*` |
| Account | `Account/Login`, `Account/Actions` |
| Navigation | `Navigation/Drawer*`, `Navigation/Flyout*`, `Page/Header/Main` |
| Language | `Language/Menu` (`flagIcon` spread) |
| Form | `Form/Input/Group` (nested Input spread) |
| Other spreads | `Drawer*`, `Dropdown` (toggle), `Search/Suggest/Summary`, `LineItem/*`, `Wishlist` as applicable |

**Per file recipe:**

1. After `vi_cva*`, add `{% set attrs = { … } %}` for every nest key used (DOM + child).
2. Replace `attributes.nested('x')` → `attrs.x` at all use sites in that file.
3. Prefer `classes.slot` for child `class=` when a `classes` map already exists or multi-slot CVA warrants it; otherwise leaving `cx.slot.apply()` on flat single-use is OK for this phase (optional align with `classes` in same edit if cheap).
4. Remove `parentAttributes` when present.

### Phase 3 — DOM-only nests (consistency sweep)

Files that only use `{{ attributes.nested('…') }}` on HTML elements (Alert, QuantityInput, Form/Input, Form/Select, MethodOption, Offcanvas, Currency/Menu, Breadcrumb, …): same `attrs` map + replace uses.

Can batch by directory. Same recipe; no behavioral change expected on flat trees.

### Phase 4 — Verify

```bash
# Should be empty (or only false positives in comments/docs samples marked historical)
rg "attributes\.nested\(" src/Resources/views/components --glob '*.twig'

# Should be empty
rg "parentAttributes" src/Resources/views/components --glob '*.twig'

# New pattern present
rg "set attrs =" src/Resources/views/components --glob '*.twig' | wc -l
```

Spot-check deep composition: PromotionForm submit button, Language/Currency Action blocks, Drawer panel/header, Login fields.

**No build steps** (agent-workflow).

---

## Example conversions

### Flat shell (`Product/Box/Actions.html.twig`)

```twig
{% set cx = vi_cva_from_file(cva) %}
{% set attrs = {
    buy: attributes.nested('buy'),
    detail: attributes.nested('detail'),
} %}

…
{{ ...attrs.buy.defaults({
    product: product,
    showQuantity: showQuantity,
    'button:label': false,
}).all() }}
```

### Shadowing host (`Cart/PromotionForm.html.twig`)

```twig
{% set classes = { root: …, field: …, submit: … } %}
{% set attrs = {
    field: attributes.nested('field'),
    submit: attributes.nested('submit'),
} %}
{# no parentAttributes #}

{{ ...attrs.field.defaults({ … }).all() }}
…
<twig:block name="append">
    {{ ...attrs.submit.defaults({ … }).all() }}
</twig:block>
```

### DOM nest (`Language/Menu` list/option + child Flag)

```twig
{% set attrs = {
    list: attributes.nested('list'),
    item: attributes.nested('item'),
    option: attributes.nested('option'),
    flagIcon: attributes.nested('flagIcon'),
} %}

<ul {{ attrs.list.defaults({ … }) }} class="{{ cx.list.apply() }}">
…
{{ ...attrs.flagIcon.defaults({ src: flagSrc, fallbackSrc: flagFallbackSrc }).all() }}
```

---

## Out of scope

- New Twig helper (`vi_attrs` / `vi_forward`)
- Changing Symfony UX / PHP
- Mass `classes` backfill where only single `cx.root.apply()` exists (optional drive-by when already editing)
- Sealed children with no nest API
- Build / theme compile

## Risk notes

- **Order:** `attrs` after `vi_cva*` is mandatory for correct class stripping.
- **Completeness:** missing a key in `attrs` and still calling `attributes.nested` at use site defeats the convention — Phase 4 grep enforces.
- **Loops:** per-item sealed mounts stay hardcoded; only shared nest bags go in `attrs` (e.g. one `flagIcon` bag reused in a language loop is correct).

## Order of work

1. Phase 1 docs (canonical + anti-patterns + flat-shell note)
2. Phase 2 child spreads + PromotionForm
3. Phase 3 DOM sweep
4. Phase 4 grep + spot-check

## Success criteria

- Docs describe `attrs` + `classes` as the pair for nest-safe composition
- No `parentAttributes` in components
- No `attributes.nested(` left under `src/Resources/views/components/` (except if any intentional root-only edge case is documented)
- Child forwards still use defaults pattern with quoted nested keys
