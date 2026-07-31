# Product:Action:Buy — drop parallel chrome props + docs

## Goal

Remove redundant Buy props that duplicate the nest attribute API (`button:label`, root `action`, …), and tighten docs so this pattern is not reintroduced.

## Problem

`Product:Action:Buy` still exposes chrome as first-class props:

- `buyLabel`, `buyIcon`, `buyColor`, `buySize` — same surface as nest `button:…`
- `formAction` — same surface as root form `action` via `attributes.defaults`

Callers already override correctly via nests (e.g. Box:Actions `'button:label': false`). Parallel props are waste and fight the nest convention in [ux-components.md § Attributes](../../docs/conventions/ux-components.md#attributes).

Docs still show the bad caller form `buy:buyLabel="…"` in the UX guide.

## Scope

| In | Out |
|----|-----|
| `Product/Action/Buy.php` + `Buy.html.twig` | Broader leaf cleanup (`Detail`, LineItem forms) unless identical one-liners |
| `docs/features/product-box.md` Buy props | New hard-rules row only if a new checklist link is needed (prefer topic edit only) |
| `docs/conventions/ux-components.md` (rule + examples) | No code changes to Box:Actions / callers (already nest-correct) |

## Implementation

### 1. `Buy.php` — keep domain + derived VM only

**Keep**

| Prop | Role |
|------|------|
| `product` | required |
| `formId` | derived `ProductBuyForm{id}` (root form id; not a child nest) |
| `showQuantity` | input gate |
| `cva` | CVA merge |
| `showQuantityField`, `productUnit`, `quantityInputName`, `quantity`, `minQuantity`, `maxQuantity`, `purchaseSteps` | derived for composition |

**Remove**

- `formAction`
- `buyLabel`, `buyIcon`, `buyColor`, `buySize`

No constructor / service changes.

### 2. `Buy.html.twig` — defaults live on nests / root attributes

Root form:

```twig
{{ attributes.defaults({
    action: path('frontend.checkout.line-item.add'),
    method: 'post',
    id: formId,
    'data-component': 'ViewsTheme:Product:Action:Buy',
    'data-component-options': { addEvent: 'ViewsTheme:Cart:Add' }|json_encode,
}) }}
```

Button (caller overrides win via `button:*`):

```twig
{{ ...attrs.button.defaults({
    type: 'submit',
    icon: 'handbag',
    label: 'listing.boxAddProduct'|trans|sw_sanitize,
    color: 'primary',
    size: 'md',
    title: 'listing.boxAddProduct'|trans|sw_sanitize,
}).all() }}
```

`quantityInput` nest unchanged.

### 3. Docs

#### `docs/features/product-box.md` — Buy table

Replace chrome/formAction rows with nest-centric API:

| Prop / field | Notes |
|--------------|--------|
| `product`, `showQuantity`, derived qty/unit/`formId`, `cva` | as today |
| Nests | `button:…` → Button (defaults: submit, handbag, `listing.boxAddProduct`, primary, md); `quantityInput:…` → QuantityInput |
| Root attrs | `action` default `path('frontend.checkout.line-item.add')`; override via form attributes |

Update behaviour note: overrides are `buy:button:label` / `buy:quantityInput:…` — **not** `buy:buyLabel`.

#### `docs/conventions/ux-components.md` — make anti-pattern explicit

1. **Fix example** that still uses `buy:buyLabel`:

```twig
{# ✅ #}
buy:button:label="{{ 'custom.add'|trans }}"
```

2. **Add leaf rule** under child-component / attributes (near “no parallel props like `usernameLabel`”):

   - A component that mounts an overridable child via nest `X` must **not** re-declare that child’s chrome as own props (`buyLabel` when nest is `button`, etc.).
   - Own `{% props %}` / public props = domain inputs + gates only.
   - Child chrome defaults only inside `attrs.X.defaults({…})`; external API = `X:prop` / `:X:prop`.
   - Same for root HTML bags: prefer `attributes.defaults({ action: path(…) })` over a pass-through `formAction` prop when the only use is the root attribute.

3. Optional one-line ❌ example:

```twig
{# ❌ parallel chrome prop + nest #}
{% props buyLabel = '…'|trans %}  {# drop — use button:label #}
```

#### `docs/conventions/hard-rules.md`

No new row unless we want a checklist pointer; the existing UX components link already covers attrs. **Topic edit only** (AGENTS.md convention SoT).

#### `.opencode/plans/child-attrs-defaults-convention.md`

Optional: fix stale `buy:buyLabel` mention if still referenced — low priority (plans archive).

## Call sites

No required call-site edits:

- `Box/Actions.html.twig` — already `'button:label': false`
- `Product/Actions.html.twig`, `BuyContainer.html.twig` — product only
- Grep shows no production `buyLabel` / `buyIcon` usage outside Buy + docs

## Verification

- Grep: no remaining `buyLabel|buyIcon|buyColor|buySize|formAction` on Buy
- Grep docs: no `buy:buyLabel`
- `php -l` on `Buy.php`
- No build step ([agent-workflow](../../docs/conventions/agent-workflow.md))

## Out of scope (follow-ups)

- `Product:Action:Detail` uses root-host `attributes.defaults` for Button (different pattern; optional later align)
- LineItem `formAction` props (same root-attr idea; separate pass)
