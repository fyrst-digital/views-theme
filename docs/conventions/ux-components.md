# UX Twig components

ViewsTheme storefront UI uses **Shopware UX Twig components** (Symfony UX TwigComponent, Shopware ≥ 6.7.11).

Namespace: **`ViewsTheme`** (plugin bundle name).

```twig
<twig:ViewsTheme:Alert type="info" content="Hello" />
<twig:ViewsTheme:QuantityInput quantity="1" size="sm" />
```

## Directory layout

Components under `src/Resources/views/components/`:

```text
Alert.html.twig                       → ViewsTheme:Alert (anonymous)
Alert.cva.twig                        # optional co-located CVA defaults
QuantityInput.html.twig               → ViewsTheme:QuantityInput
Language/Action.html.twig             → ViewsTheme:Language:Action
Language/Action.php                   # optional class-backed (view-model)
Language/Action.cva.twig
Cart/Drawer/Action.html.twig
Cart/Drawer/Action.js                 # co-located ShopwareComponent
Page/Header/Main.html.twig            → ViewsTheme:Page:Header:Main
VariantsGrid/Container.html.twig
VariantsGrid/Container.js
```

- PascalCase directories / leaf file names.
- Prefer **named files** (`Cart.html.twig` + `Cart.js`), not `index.*` (avoids import-map `:index` suffix).
- Co-located JS/SCSS/CVA/PHP share the leaf name when needed (`Name.cva.twig` for `vi_cva_from_file`; `Name.php` for class components).
- **`Page`** = global storefront layout chrome (header, footer, …).

### Class components (PHP-backed)

**Anonymous first** for pure composition and simple `{% props %}` defaults.

A **class component is a valid, preferred pattern** when the template would otherwise own heavy view-model work (collection scans, multi-field codes/flags, visibility gates). Keep Twig as **composition only** (CVA, attributes, blocks, child tags).

| | Anonymous | Class-backed |
|--|-----------|--------------|
| Props | `{% props %}` | Public properties (defaults on the class only) |
| Logic | Twig only | PHP `#[PostMount]` / getters (view-model) |
| Registration | Path only | **Service + `autoconfigure`** (required) |
| Tag | `<twig:ViewsTheme:…>` | Same (co-located class under bundle component namespace) |

**Rules:**

- Co-locate `Name.php` next to `Name.html.twig`.
- Namespace: `Fyrst\ViewsTheme\Resources\views\components\…` (Shopware `getTwigComponentNamespace()`).
- `#[AsTwigComponent]` on the class; **no** `{% props %}` in the template (public props are the API).
- Register via the `services.xml` prototype for `Resources/views/components/**/*.php` with **`autowire` + `autoconfigure`**. `autoconfigure` alone tags `#[AsTwigComponent]` but does **not** inject constructor deps (`Too few arguments to function …::__construct()`). Without registration, Twig **silently** falls back to the anonymous template and ignores the PHP class.
- Scope: **view-model only** (defaults from sales-channel context, derive display fields, `visible`). No DAL, cart rules, or business workflows.
- Twig still owns CVA, `attributes`, nested children, `asset()`, `|trans`.

#### Class props vs `#[PostMount]` (no dual defaults)

Symfony UX hydrates public props **after** `mount()` and **before** `#[PostMount]`. Defaults live **once** on the public property. Do **not** re-list the same defaults on `mount()` parameters and re-assign pass-through props.

| Concern | Where |
|---------|--------|
| Input API + simple defaults | Public properties only |
| Derivation / null→context / normalize | `#[PostMount]` reading `$this->*` |
| `mount()` | Avoid unless a real pre-hydrate need exists |

```php
// src/Resources/views/components/Language/Action.php
namespace Fyrst\ViewsTheme\Resources\views\components\Language;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PostMount;

#[AsTwigComponent]
class Action
{
    public mixed $languages = [];
    public bool $showFlag = true;
    public bool $visible = false;
    // …

    /** @param array<string, mixed> $data */
    #[PostMount]
    public function postMount(array $data): void
    {
        // resolve context defaults + derived fields from $this->*
    }
}
```

```twig
{# Action.html.twig — composition only #}
{% if visible %}
    <twig:ViewsTheme:Dropdown …>…</twig:ViewsTheme:Dropdown>
{% endif %}
```

Pilots: `Language:Action`, `Currency:Action`, `Product:Badges`, `Product:Box`, `Product:Cover`, `Product:Price`, `Product:Box:Header` / `Footer`, `Product:Action:Buy`.

## Props / CVA / attributes

### Props

- Declare inputs with `{% props %}`.
- Defaults live **only** in `{% props %}` (including `|trans`, `path(…)`, `config(…)`, `random()`, other props, `page` / `context` / `header`, ambient `__context.*`).
- Symfony applies a default only when the prop is **missing or `null`** (`!isset`). Defaults evaluate **in declaration order** — declare dependencies before dependents.
- Do **not** reassign prop names with `{% set prop = … %}` after the props block.
- Non-prop locals (e.g. `cx` from `vi_cva_from_file`) are fine.

#### Preferred: fallbacks in `{% props %}` (not `resolved*`)

Put simple fallbacks in the prop default. Use the prop name in the template. Do **not** add `{% set resolvedX = x is not null ? x : … %}` for that.

```twig
{# ✅ #}
{% props
    product = null,
    variations = product.variation|default([]),
    cva = {},
%}

{% if variations is not empty %}
    {% for variation in variations %}…{% endfor %}
{% endif %}

{# ❌ waste — same behavior as the prop default #}
{% props product = null, variations = null, cva = {} %}
{% set resolvedVariations = variations is not null ? variations : product.variation|default([]) %}
```

Ambient outer-scope values (e.g. page `formViolations`) belong in the prop default via `__context`:

```twig
{% props
    formViolations = __context.formViolations|default(null),
%}
```

**Keep** post-props `{% set %}` only when the value is not a plain default (or move multi-step derivation into a [class component](#class-components-php-backed)):

| Keep `{% set %}` / class `#[PostMount]` | Examples |
|-----------------------------------------|----------|
| Transform of a prop | rename/normalize only when it must stay inside the component |
| Multi-step / loops | find active language — prefer class `#[PostMount]` |
| Non-prop local | `options = lineItem.payload.options`, `linked`, `cx` |

#### Examples of prop defaults

```twig
{% props
    lineItem,
    label = lineItem.label|trans|sw_sanitize,
    searchTerm = page.searchTerm|default(''),
    id = 'vi-dropdown-' ~ random(),
    cva = {},
%}
```

### CVA

Multi-slot class API:

1. Default map: sibling **`Name.cva.twig`** (preferred for larger maps) or inline hash
2. Compose: `{% set cx = vi_cva_from_file(cva) %}` or `vi_cva({ … }|replace_recursive(cva))`
3. Caller override: `:cva="{ … }"` deep-merged into defaults
4. Render: `class="{{ cx.root.apply({ size: size }) }}"` / `cx.label.apply(…)`
5. Extras: `class="…"` (root) and `label:class="…"` (nested)

Always call `vi_cva` / `vi_cva_from_file` **before** rendering `attributes` / `attributes.defaults()`.

Co-locate like JS: `Alert.html.twig` + `Alert.cva.twig` (+ `Alert.js` when interactive).

See [vi_cva](../twig/vi-cva.md) and [CSS class API](css-classes.md).

### Attributes

**Preferred** wiring for props/HTML attrs (over bare tags like `data-component="…"`, `action="…"`, `aria-*="…"` on the markup):

| Target | Preferred pattern |
|--------|-------------------|
| Own root | `{{ attributes }}` / `{{ attributes.defaults({ … }) }}` |
| DOM nest (`<div>`, `<input>`, …) | Pre-bind `attrs` → `{{ attrs.slot }}` / `{{ attrs.slot.defaults({ … }) }}` |
| Child `<twig:…>` (overridable) | `class="{{ classes.slot }}"` (or `cx…`) + `{{ ...attrs.slot.defaults({ … }).all() }}` (spread; Twig ≥ 3.7; **no** `class` in defaults) |

#### `attrs` map (required for nests)

After `vi_cva` / `vi_cva_from_file`, pre-bind every nest used in the template into an **`attrs`** hash (bags only — not `.all()`, not pre-applied defaults):

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
```

- Name it **`attrs`** — never shadow UX `attributes`.
- Build **after** `vi_cva*` so slot `class` stripping has run.
- Keys = nest names (parent public API). Include every nest used (DOM or child).
- At the use site: `attrs.slot.defaults({ … })` — defaults hash stays **inline**.
- Own root stays on `attributes` / `attributes.defaults` — not via `attrs`.
- Flat sibling mounts do not shadow `attributes`, but **still use `attrs`** for one consistent nest API and safety if a host is added later.
- Do **not** use one-off aliases (`parentAttributes`); pre-bind `attrs` instead.

```twig
{# ❌ bare nest at use site #}
{{ ...attributes.nested('buy').defaults({…}).all() }}

{# ❌ defaults baked into the map #}
{% set attrs = { buy: attributes.nested('buy').defaults({…}).all() } %}
```

#### DOM nodes

Stringifies the bag to HTML. Non-class attrs go through `attrs.slot` / `attrs.slot.defaults`.

#### `class` — never in `.defaults({…})`

**Never** put `class` (or nested `slot:class`) inside `attributes.defaults({…})` / `attrs.slot.defaults({…})` — DOM or child spread.

| Need | Pattern |
|------|---------|
| Own root / slot classes | `class="{{ cx.root.apply() }}"` / `class="{{ classes.label }}"` on the element |
| Child root classes | `class="{{ classes.… }}"` / `class="{{ cx.…apply() }}"` on the `<twig:…>` tag |
| Child nested classes | `toggle:class="{{ classes.toggle }}"` (etc.) on the child tag |
| Caller extras | `class="…"` / `slot:class="…"` → CVA via `vi_cva*` → included in `cx.…apply()` / `classes.*` |

After `vi_cva` / `vi_cva_from_file`, root `class` is marked rendered; putting it in `.defaults({…})` on the same bag **drops** it (Symfony unsets rendered keys). Nested `slot:class` is stripped into the CVA slot — re-emit with `class="{{ classes.slot }}"` / `slot:class="…"`, not via defaults.

#### Child components (defaults forward)

When a parent composes an **overridable** child `<twig:…>`, use **only** `attrs` + spread + defaults. Do **not** hardcode `:prop` / `:nested:prop` on the tag next to the same nest (no parallel props like `usernameLabel`, …).

```twig
class="{{ classes.slot }}"
{{ ...attrs.slot.defaults({ … }).all() }}
```

Spread injects a **map** into the child mount: keys in the child’s `{% props %}` / public props become props; the rest become the child’s `attributes` (including deeper nests like `button:label`, `input:class`).

#### No parallel chrome props (leaf API)

A component that exposes nest `X` for an overridable child must **not** re-declare that child’s chrome as its own props.

| Own props / public fields | Child chrome |
|---------------------------|--------------|
| Domain inputs + gates only (`product`, `showQuantity`, …) | Defaults **only** inside `attrs.X.defaults({…})` |
| Derived VM for composition | External override API = `X:prop` / `:X:prop` / deeper `X:nested:prop` |

Same for **root HTML bags**: prefer `attributes.defaults({ action: path(…) })` over a pass-through `formAction` prop when the only use is the root attribute.

```twig
{# ✅ leaf — button chrome in nest defaults; no buyLabel / buyIcon props #}
{{ ...attrs.button.defaults({
    type: 'submit',
    icon: 'handbag',
    label: 'listing.boxAddProduct'|trans|sw_sanitize,
    color: 'primary',
    size: 'md',
    title: 'listing.boxAddProduct'|trans|sw_sanitize,
}).all() }}

{# ❌ parallel chrome prop when nest `button` exists #}
{% props buyLabel = 'listing.boxAddProduct'|trans|sw_sanitize %}
{{ ...attrs.button.defaults({ label: buyLabel }).all() }}
```

```twig
{% set cx = vi_cva_from_file(cva) %}
{% set classes = {
    username: cx.username.apply(),
    buy: cx.buy.apply(),
} %}
{% set attrs = {
    username: attributes.nested('username'),
    buy: attributes.nested('buy'),
} %}

{# ✅ class on the tag; all non-class inputs in defaults #}
<twig:ViewsTheme:Form:Input
    class="{{ classes.username }}"
    {{ ...attrs.username.defaults({
        type: 'email',
        id: 'loginMail',
        name: 'username',
        label: 'account.loginMailLabel'|trans|sw_sanitize,
    }).all() }}
/>

{# ✅ nested child props — quote colon keys; real booleans #}
<twig:ViewsTheme:Product:Action:Buy
    class="{{ classes.buy }}"
    {{ ...attrs.buy.defaults({
        product: product,
        showQuantity: showQuantity,
        'button:label': false,
    }).all() }}
/>

{# ❌ avoid — hardcoded props + bare nest (duplicate / order-dependent) #}
<twig:ViewsTheme:Product:Action:Buy
    class="{{ cx.buy.apply() }}"
    :product="product"
    :showQuantity="showQuantity"
    :button:label="false"
    {{ ...attributes.nested('buy').all() }}
/>

{# Caller — username:class merges via Login CVA username slot #}
<twig:ViewsTheme:Account:Login
    :username:label="false"
    username:placeholder="{{ 'account.loginMailLabel'|trans|sw_sanitize }}"
    username:size="lg"
/>

{# Caller — deeper nest on Buy via Actions (button chrome, not buyLabel) #}
<twig:ViewsTheme:Product:Actions
    :product="product"
    :buy:button:label="true"
    buy:button:label="{{ 'custom.add'|trans }}"
/>
```

- Put **all** non-class child inputs in `.defaults({ … })` — domain props and nested chrome (`'button:label': false`).
- Colon keys in the defaults hash must be **quoted** (`'button:label'`). Use real non-strings (`false`, numbers, objects) — not stringified `"false"`.
- Caller nested keys win (`.defaults` does not overwrite existing). Override from outside with `:slot:prop` / `:slot:nested:prop` / `slot:…`.
- Nest names (`buy`, `username`, `password`, …) are a parent convention — document them on the feature page. Not automatic across layers; each parent must spread via its own `attrs` map.

##### Exceptions (do not force defaults / nest)

| Case | Pattern |
|------|---------|
| Loop / per-item data | Hardcoded `:item="child"`, `:variant="variant"`, … (not from parent `attributes`) |
| Sealed leaf | Fixed child with **no** public nest API — hardcoded props only, no nest / no `attrs` entry |
| Root host wrapper | Child *is* the component root — `{{ ...attributes.defaults({ … }).all() }}` (no nest) |
| Nested CVA classes | `label:class="{{ classes.label }}"` / `icon:class="…"` stay on the tag |
| **Form:Input:Group facade** | Flat control props (`type`, `placeholder`, `size`, …) **and** nest `input` — intentional dual API so callers use `field:placeholder` not only `field:input:placeholder` ([form-input](../features/form-input.md#forminputgroup)) |

## Nested components (Symfony UX)

Inside `<twig:ViewsTheme:…>` use **HTML syntax only** for blocks — do **not** mix `{% block %}` with HTML component tags ([Symfony nested components](https://symfony.com/bundles/ux-twig-component/current/index.html#nested-components)):

```twig
{# ✅ body → default content block; for-loops OK #}
<twig:ViewsTheme:Scroll:Area class="{{ cx.root.apply() }}">
    {% for item in items %}
        <twig:ViewsTheme:Some:Child :item="item" />
    {% endfor %}
</twig:ViewsTheme:Scroll:Area>

{# ✅ named block override #}
<twig:ViewsTheme:Card>
    <twig:block name="footer">…</twig:block>
</twig:ViewsTheme:Card>

{# ❌ {% block %} inside <twig:…> — double-defines the block / Twig error #}
<twig:ViewsTheme:Child>
    <twig:block name="title">
        {% block title %}{% endblock %}
    </twig:block>
</twig:ViewsTheme:Child>
```

`class="{{ … }}"`, `:prop="expr"`, and `{% for %}` inside HTML tags are fine.

### Nested blocks: parent `cx` / `attributes` are shadowed

Child mount merges parent context, then **child props win**. If the child also defines `cx` or `attributes` (e.g. `Dropdown` inside `Account:Action`), those names inside `<twig:block>` refer to the **child**, not the parent.

**Preferred:** pre-bind before the host mount:

| Concern | Map | Not |
|---------|-----|-----|
| Applied class strings | **`classes`** | `cx` |
| Nested attribute bags | **`attrs`** | bare `attributes.nested` / `parentAttributes` |

```twig
{% set cx = vi_cva_from_file(cva) %}
{% set classes = {
    root: cx.root.apply(),
    toggle: cx.toggle.apply(),
    label: cx.label.apply(),
    submit: cx.submit.apply(),
} %}
{% set attrs = {
    submit: attributes.nested('submit'),
} %}

<twig:ViewsTheme:Dropdown class="{{ classes.root }}" …>
    <twig:block name="toggle">
        {# ❌ cx / attributes are the child’s here #}
        {# ✅ classes.* and attrs.* were bound in the parent #}
        <span class="{{ classes.label }}">…</span>
        <twig:ViewsTheme:Button
            class="{{ classes.submit }}"
            {{ ...attrs.submit.defaults({ type: 'submit' }).all() }}
        />
    </twig:block>
</twig:ViewsTheme:Dropdown>
```

- Use `classes.slot` in `class="…"`, `slot:class="…"`, and `{ class: classes.slot }`.
- Use `attrs.slot` for parent nests inside nested blocks (and everywhere else for consistency).
- Variants: `root: cx.root.apply({ size: size })` inside the `classes` hash.
- Single-slot on own DOM with no nested host may still use inline `cx.root.apply()` for classes; nests still go through `attrs`.
- Do **not** use N locals (`toggleClass`, `labelClass`, `parentAttributes`, …).

Parent props the child does **not** declare still resolve from the parent context.

When composing hosts that declare common names (`label`, `color`, `id`, …), **pre-bind** parent values into `classes` / `attrs` before the child mount — otherwise names inside `<twig:block>` are the child’s defaults (`null`). Prefer nest keys (`toggle:label`) over parallel parent props.

### Nested slots: props and single content owner

Do **not** multi-hop blocks through nested `<twig:…>` hosts (no `{% set x %}{% block %}{% endset %}` + `<twig:block>` capture/forward).

| Need | Pattern |
|------|---------|
| Scalar / simple value (title text, ids, …) | **Prop** threaded via `{% props %}` and `attrs.slot.defaults({…})` |
| Markup body | **One** component owns `{% block content %}` (the shell that wraps that DOM) |
| Rich chrome override | Caller overrides a **whole** `{% block %}` on that shell (e.g. `header`) |

```twig
{# Panel owns body content; title is a prop #}
{% props title = null %}
{% set attrs = {
    header: attributes.nested('header'),
} %}
…
<twig:ViewsTheme:Drawer:Header
    {{ ...attrs.header.defaults({
        title: title,
    }).all() }}
/>
<div class="…">
    {% block content %}{% endblock %}
</div>

{# Caller overrides panel and puts body on Panel — e.g. Navigation:Drawer #}
<twig:ViewsTheme:Drawer title="{{ label }}" …>
    <twig:block name="panel">
        <twig:ViewsTheme:Drawer:Panel title="{{ label }}" …>
            <twig:ViewsTheme:Some:Body />
        </twig:ViewsTheme:Drawer:Panel>
    </twig:block>
</twig:ViewsTheme:Drawer>
```

Do **not** nest `{% block foo %}` inside `<twig:block name="foo">` — that redefines the same block and fails at compile time.

## JavaScript

| Role | Attribute | Example |
|------|-----------|---------|
| Interactive UX root | `data-component="ViewsTheme:…"` | `ViewsTheme:VariantsGrid:Container` |
| Options | `data-component-options` | JSON |

Every `data-component` requires co-located `Name.js`. Do **not** use `data-ref`, `data-vi`, or other ad-hoc identity hooks. Prefer nested sub-components or semantic selectors for internal structure.

Co-located JS extends global `ShopwareComponent`. Build: `composer build:js:storefront`.

## Scope rules

- Migrate and create UI under **`src/Resources/views/components/` only**.
- **Do not create** new files under `src/Resources/views/storefront/`.
- **Only edit** existing storefront templates when replacing an include that already lives there.

## Migration status

| Area | Status |
|------|--------|
| Alert, Button, QuantityInput, Form:Input, Form:Input:Group (facade exception), Form:Select | UX + `vi_cva` (nest chrome; Group dual API documented) |
| Header actions, forms, wishlist, language switch | Bare attrs → `attributes.defaults` (P3) |
| Form:Input | UX + `vi_cva`; used by Account:Login (Register/Address still core include) |
| Form:Input:Group | UX + `vi_cva`; shell + nested Form:Input control; used by Cart:PromotionForm (+ Button in append) |
| Form:Select | UX + `vi_cva`; used by Cart:ShippingCalculation:Country / PaymentMethod / ShippingMethod |
| Multi-slot CVA (≥5 slots) | Sibling `.cva.twig` + `vi_cva_from_file` (P4) |
| Page:Header:* (+ Cart JS), Page:Footer:* | UX + `vi_cva` |
| Navigation:Bar (+ Bar.js), Navigation:Flyout (+ Column/Item/Teaser, Flyout.js) | UX + `vi_cva` |
| Search:* (+ Action/Overlay JS), Offcanvas, Navigation/Flyout, Cart:Drawer:* | UX / component |
| Language:Action / Currency:Action (class-backed; nest `toggle`) + Menu (via Dropdown) | UX + `vi_cva` + `Action.php` |
| Backdrop (shared; click → parent `close` via `componentName`), Drawer (+ Panel/Header/Close; Panel/Close JS), Navigation:Drawer (compose via panel override), Action / Menu / Drill JS | UX + `vi_cva` |
| Product:* | UX + Listing/BuyContainer shells; Box via storefront `card/box.html.twig` bridge; Action:Buy class-backed |
| Product:Badges (class-backed) + Product:Badge:* + Badge | UX + `vi_cva`; discount gates in `Badges.php` |
| Product:Box / Cover / Box:Header / Box:Footer (class-backed) | UX + `vi_cva`; detail URL via `ProductDetailUrlBuilder` on Cover/Header/Footer |
| LineItem:* (+ Element Image/Variants/Features/Qty/Remove JS), Cart:* (+ mutation owner / drawer), Wishlist:* | UX + JS |
| Account:Action (nest `toggle`) / Menu (`register`) / Login:Actions (`login`/`recovery`) | UX + nest chrome |
| Dropdown (Popover + CSS anchor; toggle chrome via `toggle:*` only) | UX + `vi_cva` + CSS/JS |
| Cookie:*, Filter, ContactChannel, MethodOption, GallerySlider, Review:*, Breadcrumb, ScrollUp | UX / shells |
| Scroll:Area (+ Area.js / Area.css) | UX + `vi_cva` |
| VariantsGrid:* (+ Container JS) | UX + `vi_cva` |
| Legacy `vi_define_classes` / `defaultBaseClasses` API | **Removed** |

## Related

- [Hard rules](hard-rules.md)
- [Component templates](components.md)
- [JavaScript](javascript.md)
- [`vi_cva`](../twig/vi-cva.md)
- Shopware core README: `vendor/shopware/storefront/Resources/views/components/README.md`
