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
- Co-located JS/SCSS/CVA/PHP share the leaf name when needed (`Name.cva.twig` for `vi_define_cva`; `Name.php` for class components).
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
| Ambient `formViolations` (class form VMs) | `#[PostMount]` null-coalesce from `$request->attributes->get('formViolations')` via `ComponentData::formViolations()` — class components cannot use `{% props %} __context` |
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

Pilots: `Language:Action`, `Currency:Action`, `Page:Logo`, `Product:Badges`, `Product:Box`, `Product:BuyContainer`, `Product:Actions`, `Product:Prices`, `Product:Rating`, `Product:Cover`, `Product:Price`, `Product:Box:Header` / `Body` / `Footer` / `Actions`, `Product:Action:Buy` / `Detail`, `Product:Listing`, `Product:Listing:Results`, `Cms:DescriptionReviews`, `Pagination`, `Sorting`, `Filter:Panel`, `Review:Panel` / `Results` / `Form` / `Rating`, `Account:Register`, `Address:Personal`, `Address:PersonalCompany`, `Address:Form`, `Form:Birthday`. (`Tabs` / `Tabs:List` / `Tab` / `Panel` and `Accordion` / `Item` / `Header` / `Panel` are anonymous UX + JS — not class-backed.)

## Props / CVA / attributes

### Props

- Declare inputs with `{% props %}`.
- Defaults live **only** in `{% props %}` (including `|trans`, `path(…)`, `config(…)`, `random()`, other props, `page` / `context` / `header`, ambient `__context.*`).
- Symfony applies a default only when the prop is **missing or `null`** (`!isset`). Defaults evaluate **in declaration order** — declare dependencies before dependents.
- Do **not** reassign prop names with `{% set prop = … %}` after the props block.
- Non-prop locals are fine; prefer `vi_define_cva` / `vi_class` over `{% set cx %}`.

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
2. Compose: `{% do vi_define_cva(cva) %}`
3. Caller override: `:cva="{ … }"` deep-merged into defaults
4. Render: `class="{{ vi_class('root', { size: size }) }}"` / `vi_class('label', { … })`
5. Extras: `class="…"` (root) and `label:class="…"` (nested)

Always call `vi_define_cva` **before** rendering `attributes` / `attributes.defaults()`.

Co-locate like JS: `Alert.html.twig` + `Alert.cva.twig` (+ `Alert.js` when interactive).

See [vi_define_cva](../twig/vi-cva.md) and [CSS class API](css-classes.md).

### Attributes

**Preferred** wiring for props/HTML attrs (over bare tags like `data-component="…"`, `action="…"`, `aria-*="…"` on the markup):

| Target | Preferred pattern |
|--------|-------------------|
| Own root | `{{ attributes }}` / `{{ attributes.defaults({ … }) }}` |
| DOM nest (`<div>`, `<input>`, …) | `{{ vi_attrs('slot') }}` / `{{ vi_attrs('slot').defaults({ … }) }}` |
| Child `<twig:…>` (overridable) | `class="{{ vi_class('slot') }}"` + `{{ ...vi_attrs('slot').defaults({ … }).all() }}` (spread; Twig ≥ 3.7; **no** `class` in defaults) |

#### Nest bind / resolve (`vi_define_*`)

After `vi_define_cva`, bind nests and (when needed) exported class strings — **no** `{% set attrs %}` / `{% set classes %}`:

```twig
{% do vi_define_cva(cva, ['root', 'buy', 'detail']) %}
{% do vi_define_attrs(['buy', 'detail']) %}
```

| | Bind | Resolve |
|--|------|---------|
| Nest bags | `vi_define_attrs(['buy', …])` | `vi_attrs('buy')` |
| Class strings | `vi_define_cva(cva, ['root', …])` | `vi_class('root')` / `vi_class('root', { size })` |

- Build **after** `vi_define_cva` so slot `class` stripping has run.
- Defaults stay **inline** at the use site: `vi_attrs('slot').defaults({ … })`.
- Own root stays on `attributes` / `attributes.defaults` — not via define.
- Do **not** use one-off aliases (`parentAttributes`) or materialised props locals.

See [vi-attrs.md](../twig/vi-attrs.md).

```twig
{# ❌ bare nest / set maps #}
{{ ...attributes.nested('buy').defaults({…}).all() }}
{% set attrs = { buy: attributes.nested('buy') } %}
{% set classes = { root: vi_class('root') } %}
```

#### DOM nodes

Stringifies the bag to HTML. Non-class attrs go through `vi_attrs('slot')` / `.defaults`.

#### `class` — never in `.defaults({…})`

**Never** put `class` (or nested `slot:class`) inside `attributes.defaults({…})` / `vi_attrs(…).defaults({…})` — DOM or child spread.

| Need | Pattern |
|------|---------|
| Own root / slot classes | `class="{{ vi_class('root') }}"` / `class="{{ vi_class('root', { size }) }}"` |
| Child root classes | `class="{{ vi_class('…') }}"` on the `<twig:…>` tag |
| Child nested classes | `toggle:class="{{ vi_class('toggle') }}"` (etc.) |
| Caller extras | `class="…"` / `slot:class="…"` → CVA via `vi_define_cva` → included in `vi_class` |

After `vi_define_cva`, root `class` and nested `slot:class` are **stripped into CVA slots and removed** from the bag. Re-emit with `class="{{ vi_class('slot') }}"` / `slot:class="…"`, not via defaults. Root-host children: `class="{{ vi_class('root') }}"` + `{{ ...attributes.defaults({…}).all() }}` (no `class` in defaults).

#### Child components (defaults forward)

When a parent composes an **overridable** child `<twig:…>`, use **only** `vi_attrs` + spread + defaults. Do **not** hardcode `:prop` / `:nested:prop` on the tag next to the same nest (no parallel props like `usernameLabel`, …).

```twig
class="{{ vi_class('slot') }}"
{{ ...vi_attrs('slot').defaults({ … }).all() }}
```

Spread injects a **map** into the child mount: keys in the child’s `{% props %}` / public props become props; the rest become the child’s `attributes` (including deeper nests like `button:label`, `input:class`).

#### No parallel chrome props (leaf API)

A component that exposes nest `X` for an overridable child must **not** re-declare that child’s chrome as its own props.

| Own props / public fields | Child chrome |
|---------------------------|--------------|
| Domain inputs + gates only (`product`, `showQuantity`, …) | Defaults **only** inside `vi_attrs('X').defaults({…})` |
| Derived VM for composition | External override API = `X:prop` / `:X:prop` / deeper `X:nested:prop` |

Same for **root HTML bags**: prefer `attributes.defaults({ action: path(…) })` over a pass-through `formAction` prop when the only use is the root attribute.

```twig
{# ✅ leaf — button chrome in nest defaults; no buyLabel / buyIcon props #}
{{ ...vi_attrs('button').defaults({
    type: 'submit',
    icon: 'handbag',
    label: 'listing.boxAddProduct'|trans|sw_sanitize,
    color: 'primary',
    size: 'md',
    title: 'listing.boxAddProduct'|trans|sw_sanitize,
}).all() }}

{# ❌ parallel chrome prop when nest `button` exists #}
{% props buyLabel = 'listing.boxAddProduct'|trans|sw_sanitize %}
{{ ...vi_attrs('button').defaults({ label: buyLabel }).all() }}
```

```twig
{% do vi_define_cva(cva, ['username', 'buy']) %}
{% do vi_define_attrs(['username', 'buy']) %}

{# ✅ class on the tag; all non-class inputs in defaults #}
<twig:ViewsTheme:Form:Input
    class="{{ vi_class('username') }}"
    {{ ...vi_attrs('username').defaults({
        type: 'email',
        id: 'loginMail',
        name: 'username',
        label: 'account.loginMailLabel'|trans|sw_sanitize,
    }).all() }}
/>

{# ✅ nested child props — quote colon keys; real booleans #}
<twig:ViewsTheme:Product:Action:Buy
    class="{{ vi_class('buy') }}"
    {{ ...vi_attrs('buy').defaults({
        product: product,
        showQuantity: showQuantity,
        'button:label': false,
    }).all() }}
/>

{# ❌ avoid — hardcoded props + bare nest (duplicate / order-dependent) #}
<twig:ViewsTheme:Product:Action:Buy
    class="{{ vi_class('buy') }}"
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

{# Caller — deeper nest on Buy via Box:Actions (button chrome, not buyLabel) #}
<twig:ViewsTheme:Product:Box:Actions
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
| Root host wrapper | Child *is* the component root — `class="{{ vi_class('root') }}"` + `{{ ...attributes.defaults({ … }).all() }}` (no nest; no `class` in defaults) |
| Nested CVA classes | `label:class="{{ vi_class('label') }}"` / `icon:class="…"` stay on the tag |
| **Form:Input:Group facade** | Flat control props (`type`, `placeholder`, `size`, …) **and** nest `input` — intentional dual API so callers use `field:placeholder` not only `field:input:placeholder` ([form-input](../features/form-input.md#forminputgroup)) |

## Nested components (Symfony UX)

Inside `<twig:ViewsTheme:…>` use **HTML syntax only** for blocks — do **not** mix `{% block %}` with HTML component tags ([Symfony nested components](https://symfony.com/bundles/ux-twig-component/current/index.html#nested-components)):

```twig
{# ✅ body → default content block; for-loops OK #}
<twig:ViewsTheme:Scroll:Area class="{{ vi_class('root') }}">
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

### Nested blocks: parent locals are shadowed

Child mount merges parent context, then **child props win**. Host templates that set `cx` / `attributes` (and used to set `attrs` / `classes`) shadow those names inside `<twig:block>`.

**Required:** bind with `vi_define_*` on the parent; resolve with `vi_attrs` / `vi_class` (stack walk — works in own template and nested host blocks):

```twig
{% do vi_define_cva(cva, ['root', 'field', 'submit']) %}
{% do vi_define_attrs(['field', 'submit']) %}

<twig:ViewsTheme:Form:Input:Group class="{{ vi_class('field') }}" …>
    <twig:block name="append">
        <twig:ViewsTheme:Button
            class="{{ vi_class('submit') }}"
            {{ ...vi_attrs('submit').defaults({
                type: 'submit',
                icon: 'ticket',
            }).all() }}
        />
    </twig:block>
</twig:ViewsTheme:Form:Input:Group>
```

- Defaults stay **inline** at the use site — do not invent materialised locals (`submitProps`, …).
- Class variants: always at the **use site** — `vi_class('root', { size: size })`. Do **not** bake variants into `vi_define_cva`.
- Do **not** use `{% set cx %}` / `cx.slot.apply()` — only `vi_define_cva` + `vi_class`.
- Do **not** use N locals (`toggleClass`, `parentAttributes`, …) or `{% set attrs/classes %}`.

Parent props the child does **not** declare still resolve from the parent context. Prefer nest keys (`toggle:label`) over parallel parent props when composing hosts that share names (`label`, `color`, `id`, …).

See [vi-attrs.md](../twig/vi-attrs.md).

### Nested slots: props and single content owner

Do **not** multi-hop blocks through `{% set x %}{% block %}{% endset %}` + `<twig:block>` capture/forward.

A `{% block foo %}` inside a nested `<twig:…>` belongs to that inner host — callers of the outer component cannot fill it. Forward with [`{% vi_block %}`](../twig/vi-block.md) (Symfony `outerBlocks` under the hood):

```twig
<twig:ViewsTheme:Grid columns="6" gap="3">
    <twig:block name="content">
        {% vi_block prepend %}{% endvi_block %}
        {% vi_block accountType %}
            {# default #}
        {% endvi_block %}
        {% vi_block append %}{% endvi_block %}
    </twig:block>
</twig:ViewsTheme:Grid>
```

```twig
<twig:ViewsTheme:Address:Personal …>
    <twig:block name="accountType">…</twig:block>
    <twig:block name="append">…</twig:block>
</twig:ViewsTheme:Address:Personal>
```

| Need | Pattern |
|------|---------|
| Scalar / simple value (title text, ids, …) | **Prop** threaded via `{% props %}` and `vi_attrs('slot').defaults({…})` |
| Markup body | **One** component owns `{% block content %}` (the shell that wraps that DOM) |
| Rich chrome override | Caller overrides a **whole** `{% block %}` on that shell (e.g. `header`) |
| Slot inside a nested host | `{% vi_block NAME %}default{% endvi_block %}` — not `{% block NAME %}` inside the nested tag |

```twig
{# Panel owns body content; title is a prop #}
{% props title = null %}
{% do vi_define_attrs(['header']) %}
…
<twig:ViewsTheme:Drawer:Header
    {{ ...vi_attrs('header').defaults({
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
| Alert, Button, Blockquote, Progress, QuantityInput, Form:Input, Form:Input:Group (facade exception), Form:Select | UX + `vi_cva` (nest chrome; Group dual API documented) |
| Header actions, forms, wishlist, language switch | Bare attrs → `attributes.defaults` (P3) |
| Form:Input | UX + `vi_cva`; native `required` / `confirmFor`; used by Account:Login + Register/Address |
| Form:Birthday (class-backed) | UX + `vi_cva`; day/month/year options in `Birthday.php` |
| Form:Handler / Form:Toggle | UX + `data-component`; shared `@views-theme/modules/shared/form.js` |
| Form:Input:Group | UX + `vi_cva`; shell + nested Form:Input control; used by Cart:PromotionForm (+ Button in append) |
| Form:Select | UX + `vi_cva`; used by Cart:ShippingCalculation:Country / PaymentMethod / ShippingMethod |
| Multi-slot CVA (≥5 slots) | Sibling `.cva.twig` + `vi_define_cva` |
| Page:Header:* (+ Cart JS), Page:Footer:* | UX + `vi_cva` |
| Navigation:Bar (+ Bar.js), Navigation:Flyout (+ Column/Item/Teaser, Flyout.js) | UX + `vi_cva` |
| Search:* (+ Action/Overlay JS), Offcanvas, Navigation/Flyout, Cart:Drawer:* | UX / component |
| Language:Action / Currency:Action (class-backed; nest `toggle`) + Menu (via Dropdown) | UX + `vi_cva` + `Action.php` |
| Backdrop (shared; click → parent `close` via `componentName`), Drawer (+ Panel/Header/Close; Panel/Close JS), Navigation:Drawer (compose via panel override), Action / Menu / Drill JS | UX + `vi_cva` |
| Product:* | UX; BuyContainer class-backed + buy-widget bridge; Listing class-backed + storefront listing bridge; Box via `card/box.html.twig` bridge; Action:Buy / Action:Detail class-backed |
| Product:Listing (class-backed + JS owner) | Results island + `/vi/listing/*` controllers; [product-listing.md](../features/product-listing.md) |
| Pagination / Sorting (class-backed + JS) | Theme controls → Listing owner; [pagination.md](../features/pagination.md) · [sorting.md](../features/sorting.md) |
| Filter:* (Drawer compose + Drawer:Action, Panel, Group + Toggle/Count, Chip, MultiSelect, Boolean, Range, Rating, Active) | Theme filters + lazy drawer; [filters.md](../features/filters.md) |
| Product:Badges (class-backed) + Product:Badge:* + Badge | UX + `vi_cva`; discount gates in `Badges.php` |
| Product:Box / Cover / Box:Header / Body / Footer / Action:Detail (class-backed) | UX + `vi_cva`; detail URL via `ProductDetailUrlBuilder` on Cover/Header/Footer + Detail fallback |
| LineItem:* (+ Quantity/Remove JS only; `layout` stacked/grid), Cart:* (+ mutation owner / drawer / page), Wishlist:* | UX + JS |
| Account:Action (nest `toggle`) / Menu (`register`) / Login:Actions (`login`/`recovery`) | UX + nest chrome |
| Privacy:Note | Anonymous UX + `vi_cva`; register footer; optional `acceptedDataProtection` checkbox |
| Checkout:Confirm (+ Addresses / Payment / Shipping / Tos / Comment / Aside) + Checkout:Method / Method:Form | Anonymous UX; confirm page composer — [checkout-confirm.md](../features/checkout-confirm.md) |
| Dropdown (Popover + CSS anchor; toggle chrome via `toggle:*` only) | UX + `vi_cva` + CSS/JS |
| Gallery (+ Thumbnails/Thumb/Canvas/Slide/Control/Dots/Dot JS) | UX + scroll-snap PDP gallery; [gallery.md](../features/gallery.md) |
| Cookie:*, Filter, ContactChannel, ScrollUp | UX / shells; core `sw_extends` shells runtime-deprecated (`{% deprecated %}`, see [components.md#extends-shells](components.md#extends-shells)) |
| Order:Item* shells | Legacy core `sw_extends` shells — `{% deprecated %}` since 1.0.0 |
| Tabs / Tabs:List / Tab / Panel | Anonymous UX + JS; [tabs.md](../features/tabs.md) |
| Accordion / Item / Header / Panel | Anonymous UX + JS; [accordion.md](../features/accordion.md) |
| Review:* (Panel owner + Results island + Matrix/Sort/Language controls + Form/Login) | Theme-owned reviews + `/vi/product/…/reviews`; [review.md](../features/review.md); Item:Comment → Blockquote |
| Review:Rating (class-backed) | UX + `vi_cva` + `Rating.php` → `starIcons` |
| Review:Matrix (class-backed) + Matrix:Check / Bar / Share | UX + `vi_cva` + `Matrix.php` → `rows` / `visible`; Bar → Progress |
| Breadcrumb (+ Item; class-backed) | UX + `vi_cva`; SoT `categoryId` → `CategoryBreadcrumbBuilder`; [breadcrumb.md](../features/breadcrumb.md) |
| Scroll:Area (+ Area.js / Area.css) | UX + `vi_cva` |
| VariantsGrid:* (+ Container JS) | UX + `vi_cva` |
| Legacy `vi_define_classes` / `defaultBaseClasses` API | **Removed** |

## Related

- [Hard rules](hard-rules.md)
- [Component templates](components.md)
- [JavaScript](javascript.md)
- [`vi_cva`](../twig/vi-cva.md)
- [vi_define_cva / vi_class](../twig/vi-cva.md) · [vi_define_attrs / vi_attrs](../twig/vi-attrs.md) · [`{% vi_block %}`](../twig/vi-block.md)
- Shopware core README: `vendor/shopware/storefront/Resources/views/components/README.md`
