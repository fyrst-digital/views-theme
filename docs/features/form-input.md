# Form input

Reusable form field primitives owned by the theme:

| Component | Role |
|-----------|------|
| `ViewsTheme:Form:Input` | Stacked text field (`form-group` + control) |
| `ViewsTheme:Form:Input:Group` | Field with Bootstrap `input-group` (prepend / control / append); control is `Form:Input` |
| `ViewsTheme:Form:Select` | Stacked select field (`form-group` + `<select>`) |
| `ViewsTheme:Form:Switch` | Bootstrap switch (`form-check form-switch` + `role="switch"`) |
| `ViewsTheme:Form:Slider` | Single- or dual-thumb range slider (native `<input type="range">`) |

`Form:Input` replaces Storefront `component/form/form-input.html.twig` for theme-owned forms. `Form:Select` replaces `component/form/form-select.html.twig`.

## Usage

```twig
<twig:ViewsTheme:Form:Input
    type="email"
    id="loginMail"
    name="username"
    label="{{ 'account.loginMailLabel'|trans|sw_sanitize }}"
    autocomplete="username webauthn"
    :error="loginError"
    validationRules="required,email"
    class="vi-account-login__email flex-fill"
/>
```

## Props

| Prop | Default | Notes |
|------|---------|--------|
| `id` | `null` | Required at call site |
| `name` | `null` | Required at call site |
| `type` | `'text'` | Native input type |
| `label` | `null` | Label text (HTML allowed; prefer sanitized) |
| `value` | `null` | Omitted when empty |
| `placeholder` | `null` | |
| `autocomplete` | `null` | |
| `minlength` / `maxlength` | `null` | |
| `disabled` | `false` | |
| `size` | `null` | `sm` / `md` / `lg` → `form-control-*` |
| `description` | `null` | Help text under the field |
| `validationRules` | `null` | Comma list → `data-validation` (Storefront form-handler) |
| `violationPath` | `null` | Server violation key (e.g. `'/email'`) |
| `error` | `false` | Force invalid styling without violations |
| `formViolations` | `__context.formViolations\|default(null)` | Ambient outer-scope default in `{% props %}` |
| `cva` | `{}` | Slot class overrides |

## Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-group` | `class="…"` |
| label | `form-label` | `label:class` |
| required | `form-required-label` | `required:class` |
| input | `form-control` (+ size / `is-invalid`) | `input:class` |
| description | `form-text` | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

Extra HTML attributes on the control: nested `input:…` (e.g. `input:data-foo="bar"`). Do **not** pass a prop named `attributes`.

To omit an HTML attribute in `attributes.defaults` / `nested().defaults`, pass **`false`** — never `null` (Symfony UX coerces `null` → boolean `true`, which renders bare attrs like `disabled`).

## Core → UX mapping

| Core `sw_include` | `Form:Input` |
|-------------------|--------------|
| `additionalClass` | root `class` |
| `additionalInputClass` | `input:class` |
| `attributes` hash | nested `input:…` |

## Call sites

| Consumer | Status |
|----------|--------|
| `Account:Login` | Uses `Form:Input`; unique per-instance ids; forwards via `username:*` / `password:*` spread ([account-action](account-action.md#accountlogin-field-forwarding)) |
| `Cart:PromotionForm` | Uses `Form:Input:Group` + `Button` in `append` ([cart-drawer](cart-drawer.md#promotion-form)) |
| `Cart:ShippingCalculation:*` | Uses `Form:Select` via `:options` + `:value` ([cart-drawer](cart-drawer.md#shipping-calculation)) |
| `Filter:Boolean` | Uses `Form:Switch` inside bar chip ([filters.md](filters.md)) |
| `Filter:Range` | Uses `Form:Slider` (`mode=range`) under min/max fields ([filters.md](filters.md)) |
| `Account:Register`, `Address:*` | Still core `form-input` / `form-select` includes |

---

## Form:Input:Group

Bootstrap **input-group** shell: optional label + group (prepend / control / append) + description / feedback. Control is nested `Form:Input` (`label` / `description` / feedback chrome suppressed; root `d-contents` so the control participates in the input-group flex row). Does **not** own `<form>` or JS.

### Usage

```twig
<twig:ViewsTheme:Form:Input:Group
    id="promo"
    name="code"
    label="{{ 'checkout.addPromotionLabel'|trans|sw_sanitize }}"
    label:class="visually-hidden"
    placeholder="…"
    validationRules="required"
>
    <twig:block name="append">
        <twig:ViewsTheme:Button type="submit" color="secondary" icon="ticket" title="…" />
    </twig:block>
</twig:ViewsTheme:Form:Input:Group>
```

### Props

Same field props as `Form:Input` (intentional **facade**: flat control props forward into nest `input` so callers can use `placeholder` / `field:placeholder` without `input:placeholder`). `size` applies to the **group** slot (`input-group-*`) and is also forwarded to the nested control. See [no parallel chrome props](../conventions/ux-components.md#no-parallel-chrome-props-leaf-api) — Group is the documented exception.

### Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-group` | `class="…"` |
| label | `form-label` | `label:class` |
| required | `form-required-label` | `required:class` |
| group | `input-group` (+ size) | `group:class` |
| input | (forwarded to nested `Form:Input` `input:class`) | `input:class` |
| description | `form-text` | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

### Blocks

| Block | Default |
|-------|---------|
| `label` | Optional label (+ required marker) |
| `group` | `div.input-group` wrapping prepend / input / append |
| `prepend` | Empty — put leading addons / buttons here |
| `input` | Nested `Form:Input` (control only) |
| `append` | Empty — put trailing addons / `Button` here |
| `description` / `feedback` | Same idea as `Form:Input` |

Nested attrs: `label:*`, `group:*`, `input:*`, `description:*`, `feedback:*`.

Inside a parent `<twig:block name="append">`, Group shadows parent locals. Use **`vi_define_cva` / `vi_class`** and **`vi_define_attrs` / `vi_attrs`** (stack). See [vi-cva](../twig/vi-cva.md) · [vi-attrs](../twig/vi-attrs.md).

---

## Form:Select

Stacked select field: optional label + `<select>` + description / feedback. Does **not** own `<form>` or JS.

**Simple:** pass `:options` (+ optional `:value`). **Complex:** override the `options` block (e.g. disabled “not available” rows in shipping calculation).

### Usage

```twig
{# Simple — structured options #}
<twig:ViewsTheme:Form:Select
    id="salutation"
    name="salutationId"
    label="{{ 'account.personalSalutationLabel'|trans|sw_sanitize }}"
    :options="salutationOptions"
    :value="selectedSalutationId"
/>

{# Complex — block override #}
<twig:ViewsTheme:Form:Select
    id="vi-cart-paymentMethodId"
    name="paymentMethodId"
    label="{{ 'checkout.paymentMethod'|trans|sw_sanitize }}"
>
    <twig:block name="options">
        {% if selectedId not in paymentMethods.ids %}
            <option value="{{ selectedId }}" selected="selected" disabled="disabled">
                {{ selectedName }} {{ 'checkout.notAvailableSuffix'|trans|sw_sanitize }}
            </option>
        {% endif %}
        {% for payment in paymentMethods %}
            <option value="{{ payment.id }}" {% if payment.id == selectedId %}selected="selected"{% endif %}>
                {{ payment.translated.name }}
            </option>
        {% endfor %}
    </twig:block>
</twig:ViewsTheme:Form:Select>
```

### Props

| Prop | Default | Notes |
|------|---------|--------|
| `id` | `null` | Required at call site |
| `name` | `null` | Required at call site |
| `label` | `null` | Label text (HTML allowed; prefer sanitized) |
| `options` | `[]` | Iterable of `{ value, label, disabled?, selected? }` |
| `value` | `null` | Selected value (preferred over per-option `selected`) |
| `size` | `null` | `sm` / `md` / `lg` → `form-select-*` |
| `autocomplete` | `null` | |
| `disabled` | `false` | |
| `description` | `null` | Help text under the field |
| `validationRules` | `null` | Comma list → `data-validation` |
| `violationPath` | `null` | Server violation key |
| `error` | `false` | Force invalid styling without violations |
| `formViolations` | `__context.formViolations\|default(null)` | Ambient outer-scope default in `{% props %}` |
| `cva` | `{}` | Slot class overrides |

### Option hash

| Key | Required | Notes |
|-----|----------|--------|
| `value` | yes | `<option value>` |
| `label` | yes | Option text |
| `disabled` | no | Default `false` |
| `selected` | no | Used only when `value` prop is `null` |

### Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-group` | `class="…"` |
| label | `form-label` (+ size `sm → fs-6`) | `label:class` |
| required | `form-required-label` | `required:class` |
| select | `form-select cursor-pointer` (+ size / `is-invalid`) | `select:class` |
| description | `form-text` | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

### Blocks

| Block | Default |
|-------|---------|
| `label` | Optional label (+ required marker) |
| `select` | `<select class="form-select">` wrapping options |
| `options` | Loop over `options` prop → plain `<option>`; override for complex markup |
| `description` / `feedback` | Same idea as `Form:Input` |

Nested attrs: `label:*`, `select:*`, `description:*`, `feedback:*`. Extra HTML attributes on the control: nested `select:…`.

No `Form:Select:Option` sub-component — native `<option>` is enough (low CSS value, mount cost per row).

### Core → UX mapping

| Core `sw_include` | `Form:Select` |
|-------------------|---------------|
| `additionalClass` | root `class` |
| `additionalSelectClass` | `select:class` |
| `options` (HTML string) | `:options` prop **or** `{% block options %}` override |
| `attributes` hash | nested `select:…` |

---

## Form:Switch

Bootstrap **switch** control (`form-check form-switch` + `role="switch"`). Presentational only (no `data-component` / JS). Dense bar layout is **caller-owned** via root `class` / nest attrs — no layout prop.

### Usage

```twig
{# Dense bar chip — caller owns flex utilities; BS float/margin fix in scss/_form.scss #}
<twig:ViewsTheme:Form:Switch
    id="shippingFree"
    name="shipping-free"
    label="{{ 'listing.filterFreeShippingDisplayName'|trans|sw_sanitize }}"
    value="1"
    :reverse="true"
    class="d-inline-flex align-items-center gap-2 m-0 p-0"
    input:class="flex-shrink-0"
    label:class="m-0"
/>
```

### Props

| Prop | Default | Notes |
|------|---------|--------|
| `id` | `vi-form-switch-{random}` | Label `for` target |
| `name` | `null` | Omitted when empty |
| `label` | `null` | Beside the track |
| `value` | `'1'` | Checkbox value when on |
| `checked` | `false` | |
| `disabled` | `false` | Use `false` not `null` in defaults |
| `reverse` | `false` | DOM order: label then input (no `form-check-reverse`) |
| `description` | `null` | Help text |
| `validationRules` | `null` | → `data-validation` |
| `violationPath` / `error` / `formViolations` | same as Input | Optional invalid chrome |
| `cva` | `{}` | |

### Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-check form-switch` | `class="…"` (e.g. `d-inline-flex gap-2 m-0 p-0`) |
| input | `form-check-input cursor-pointer` (+ `is-invalid`) | `input:class` |
| label | `form-check-label` | `label:class` |
| description | `form-text` | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

Nested attrs: `input:*`, `label:*`, `description:*`, `feedback:*`.

No co-located `Switch.css`. Dense bar layout is caller utilities. Theme BS form-check/switch float & negative-margin neutralize: `app/storefront/src/scss/_form.scss`.

### Call sites

| Consumer | Status |
|---------|--------|
| `Filter:Boolean` | Bar chip + `Form:Switch` (`class` utilities + `:reverse`) — [filters.md](filters.md) |

---

## Form:Slider

Single- or dual-thumb range control. Native stacked `<input type="range">` thumbs (no third-party lib). Owns fill paint + clamp via co-located JS.

### Usage

```twig
{# Dual thumb #}
<twig:ViewsTheme:Form:Slider
    mode="range"
    :min="0"
    :max="1200"
    :step="1"
    :start="0"
    :end="1200"
    ariaLabelMin="Price min"
    ariaLabelMax="Price max"
/>

{# Single thumb #}
<twig:ViewsTheme:Form:Slider
    mode="single"
    :min="0"
    :max="100"
    :value="50"
    name="opacity"
    ariaLabel="Opacity"
/>
```

### Props

| Prop | Default | Notes |
|------|---------|--------|
| `id` | `vi-form-slider-{random}` | Root id; thumbs get `-min` / `-max` / `-value` |
| `mode` | `'single'` | `'single'` \| `'range'` |
| `min` / `max` | `0` / `100` | Bounds |
| `step` | `1` | |
| `value` | `min` | Single thumb |
| `start` / `end` | `min` / `max` | Range thumbs |
| `name` | `null` | Single: optional form name |
| `minName` / `maxName` | `null` | Range: optional form names |
| `disabled` | `false` | Use `false` not `null` in defaults |
| `ariaLabel` | `null` | Single (or fallback) |
| `ariaLabelMin` / `ariaLabelMax` | `null` | Range |
| `cva` | `{}` | |

### Classes / slots

Layout/chrome that has a Bootstrap utility lives in CVA. Component CSS is geometry tokens, range appearance reset, thumb **pseudos**, runtime fill `%`, and range z-index only.

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `vi-form-slider position-relative d-block w-100` (+ mode BEM; disabled → `pe-none opacity-50`) | `class="…"` |
| track | `vi-form-slider__track` + absolute/center/`rounded-pill`/`bg-light`/`pe-none` | `track:class` |
| fill | `vi-form-slider__fill` + absolute/`rounded-pill`/`bg-primary` | `fill:class` |
| input | `vi-form-slider__input` + absolute fill/`m-0 p-0`/`bg-transparent`/`pe-none` | `input:class` |

Nested attrs: `track:*`, `fill:*`, `input:*`.

### JS API (`data-component="ViewsTheme:Form:Slider"`)

| Method | Role |
|--------|------|
| `getValues()` | `{ value }` or `{ start, end }` (numbers) |
| `setValues(values, { silent? })` | Update thumbs + fill; `silent` (default `true`) skips root events |

Root dispatches bubbling `input` (while dragging / each step) and `change` (commit — thumb release). `setValues` with `silent: false` emits both. Consumers that mutate listings should apply on **`change` only**, not `input`.

### CSS tokens (component consume + fallback)

| Token | Role |
|-------|------|
| `--vi-track-h` | Track height |
| `--vi-fill-start` / `--vi-fill-end` | Fill edges as `%` (set by JS) |
| `--vi-thumb-size` / `--vi-thumb-bg` / `--vi-thumb-border` / `--vi-thumb-shadow` / `--vi-thumb-focus` | Thumbs (pseudo) |

Track/fill colors default via CVA (`bg-light` / `bg-primary`). Theme may override the BEM host if needed.

Co-located: `Form/Slider.css` (non-utility only).

### Call sites

| Consumer | Status |
|----------|--------|
| `Filter:Range` | `mode="range"` under price fields — [filters.md](filters.md) |

## Related

- [UX components](../conventions/ux-components.md)
- [Account action](account-action.md) (login in header menu)
- [Cart drawer](cart-drawer.md) (promotion form, shipping calculation)
- [Filters](filters.md) (`Filter:Boolean`, `Filter:Range`)
