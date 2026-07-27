# UX Twig components

ViewsTheme storefront UI uses **Shopware UX Twig components** (Symfony UX TwigComponent, Shopware ≥ 6.7.11).

Namespace: **`ViewsTheme`** (plugin bundle name).

```twig
<twig:ViewsTheme:Alert type="info" content="Hello" />
<twig:ViewsTheme:QuantityInput quantity="1" size="sm" />
```

## Directory layout

Anonymous components under `src/Resources/views/components/`:

```text
Alert.html.twig                       → ViewsTheme:Alert
Alert.cva.twig                        # optional co-located CVA defaults
QuantityInput.html.twig               → ViewsTheme:QuantityInput
Page/Header.html.twig                 → ViewsTheme:Page:Header
Page/Header/Main.html.twig            → ViewsTheme:Page:Header:Main
Cart/Drawer/Action.html.twig
Cart/Drawer/Action.js                 # co-located ShopwareComponent
Page/Footer/Bottom.html.twig          → ViewsTheme:Page:Footer:Bottom
VariantsGrid/Container.html.twig
VariantsGrid/Container.js
```

- PascalCase directories / leaf file names.
- Prefer **named files** (`Cart.html.twig` + `Cart.js`), not `index.*` (avoids import-map `:index` suffix).
- Co-located JS/SCSS/CVA share the leaf name when needed (`Name.cva.twig` for `vi_cva_from_file`).
- **`Page`** = global storefront layout chrome (header, footer, …).

## Props / CVA / attributes

### Props

- Declare inputs with `{% props %}`.
- Defaults live **only** in `{% props %}` (including `|trans`, `path(…)`, etc.).
- Do **not** reassign prop names with `{% set prop = … %}` after the props block.
- Non-prop locals (e.g. `cx` from `vi_cva_from_file`) are fine.

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
| DOM node (`<div>`, `<input>`, …) | `{{ attributes.defaults({ … }) }}` / `{{ attributes.nested('slot').defaults({ … }) }}` |
| Child `<twig:…>` (overridable) | `class="{{ cx… }}"` + `{{ ...attributes.nested('slot').defaults({ … }).all() }}` (spread; Twig ≥ 3.7; **no** `class` in defaults) |

- Call `attributes.nested('slot')` **inline** — do not assign it to an intermediate variable.
- Pass the defaults hash **inline** to `.defaults({ … })` — do not assign it to an intermediate variable.

#### DOM nodes

Stringifies the bag to HTML. Non-class attrs go through `defaults` / `nested().defaults`.

#### `class` — never in `.defaults({…})`

**Never** put `class` (or nested `slot:class`) inside `attributes.defaults({…})` / `nested(…).defaults({…})` — DOM or child spread.

| Need | Pattern |
|------|---------|
| Own root / slot classes | `class="{{ cx.root.apply() }}"` / `class="{{ cx.label.apply() }}"` on the element |
| Child root classes | `class="{{ cx.…apply() }}"` on the `<twig:…>` tag |
| Child nested classes | `toggle:class="{{ cx.toggle.apply() }}"` (etc.) on the child tag |
| Caller extras | `class="…"` / `slot:class="…"` → CVA via `vi_cva*` → included in `cx.…apply()` |

After `vi_cva` / `vi_cva_from_file`, root `class` is marked rendered; putting it in `.defaults({…})` on the same bag **drops** it (Symfony unsets rendered keys). Nested `slot:class` is stripped into the CVA slot — re-emit with `class="{{ cx.slot.apply() }}"` / `slot:class="…"`, not via defaults.

#### Child components (preferred forward)

When a parent composes a child `<twig:…>` and callers may need to override that child’s props or nested attrs, **prefer nest + spread + defaults** over a long hardcoded prop list or parallel props (`usernameLabel`, …).

Spread injects a **map** into the child mount: keys in the child’s `{% props %}` become props; the rest become the child’s `attributes` (including deeper nests like `input:class`).

```twig
{# ✅ class on the tag; defaults for non-class only #}
<twig:ViewsTheme:Form:Input
    class="{{ cx.username.apply() }}"
    {{ ...attributes.nested('username').defaults({
        type: 'email',
        id: 'loginMail',
        name: 'username',
        label: 'account.loginMailLabel'|trans|sw_sanitize,
    }).all() }}
/>

{# Caller — username:class merges via Login CVA username slot #}
<twig:ViewsTheme:Account:Login
    :username:label="false"
    username:placeholder="{{ 'account.loginMailLabel'|trans|sw_sanitize }}"
    username:input:class="form-control-lg"
/>
```

- Put non-class child defaults in `.defaults({ … })`; caller nested keys win.
- Use `:slot:prop="…"` for non-strings (e.g. `:username:label="false"`). Static `username:label="false"` is the string `"false"`.
- Nest names (`username`, `password`, …) are a parent convention — document them on the feature page. Not automatic across layers; each parent must spread.
- Skip spread only when the child call is fixed and must never be overridden from outside.

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

```twig
{% set cx = vi_cva_from_file(cva) %}
{% set labelClass = cx.label.apply() %}  {# bind before child mount #}

<twig:ViewsTheme:Dropdown …>
    <twig:block name="toggle">
        {# ❌ cx is Dropdown’s CVA here — parent label:class is lost #}
        {# ✅ use precomputed locals #}
        <span class="{{ labelClass }}">{{ label }}</span>
    </twig:block>
</twig:ViewsTheme:Dropdown>
```

Parent props the child does **not** declare (e.g. `label` text) still resolve from the parent context.

### Nested slots: props and single content owner

Do **not** multi-hop blocks through nested `<twig:…>` hosts (no `{% set x %}{% block %}{% endset %}` + `<twig:block>` capture/forward).

| Need | Pattern |
|------|---------|
| Scalar / simple value (title text, ids, …) | **Prop** threaded via `{% props %}` and `attributes.nested(…).defaults({…})` |
| Markup body | **One** component owns `{% block content %}` (the shell that wraps that DOM) |
| Rich chrome override | Caller overrides a **whole** `{% block %}` on that shell (e.g. `header`) |

```twig
{# Panel owns body content; title is a prop #}
{% props title = null %}
…
<twig:ViewsTheme:Drawer:Header
    {{ ...attributes.nested('header').defaults({
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
| Alert, Button, QuantityInput, Form:Input, Form:Input:Group | UX + `vi_cva` (convention-aligned attrs/props) |
| Header actions, forms, wishlist, language switch | Bare attrs → `attributes.defaults` (P3) |
| Form:Input | UX + `vi_cva`; used by Account:Login (Register/Address still core include) |
| Form:Input:Group | UX + `vi_cva`; used by Cart:PromotionForm (+ Button in append) |
| Multi-slot CVA (≥5 slots) | Sibling `.cva.twig` + `vi_cva_from_file` (P4) |
| Page:Header:* (+ Cart JS), Page:Footer:* | UX + `vi_cva` |
| Navigation:Bar (+ Bar.js), Navigation:Flyout (+ Column/Item/Teaser, Flyout.js) | UX + `vi_cva` |
| Search:* (+ Action/Overlay JS), Offcanvas, Navigation/Flyout, Cart:Drawer:* | UX / component |
| Language:Action / Language:Menu, Currency:Action / Currency:Menu (via Dropdown) | UX + `vi_cva` |
| Drawer (+ Panel/Header/Backdrop/Close; Panel/Backdrop/Close JS), Navigation:Drawer (compose via panel override), Action / Menu / Drill JS | UX + `vi_cva` |
| Product:* | UX + Listing/BuyContainer shells |
| LineItem:* (+ Element Image/Variants/Features/Qty/Remove JS), Cart:* (+ mutation owner / drawer), Wishlist:* | UX + JS |
| Account:Action / Account:Menu, Address:*, Checkout:*, Order:* | UX / shells |
| Dropdown (Popover + CSS anchor, a11y JS) | UX + `vi_cva` + CSS/JS |
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
