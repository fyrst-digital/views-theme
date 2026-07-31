# Form input

Reusable form field primitives owned by the theme:

| Component | Role |
|-----------|------|
| `ViewsTheme:Form:Input` | Stacked text field (`form-group` + control) |
| `ViewsTheme:Form:Input:Group` | Field with Bootstrap `input-group` (prepend / control / append); control is `Form:Input` |
| `ViewsTheme:Form:Select` | Stacked select field (`form-group` + `<select>`) |

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

## Related

- [UX components](../conventions/ux-components.md)
- [Account action](account-action.md) (login in header menu)
- [Cart drawer](cart-drawer.md) (promotion form, shipping calculation)
