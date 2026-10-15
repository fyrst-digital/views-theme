# Form input

Reusable form field primitives owned by the theme:

| Component | Role |
|-----------|------|
| `ViewsTheme:Form:Input` | Stacked text field (`.form-group` + `.form-control`). Optional `success` chrome |
| `ViewsTheme:Form:Input:Group` | Joined shell (prepend / plain `Form:Input` / append). Height follows the field padding |
| `ViewsTheme:Form:Textarea` | Stacked textarea; same violation/description API as Input |
| `ViewsTheme:Form:Select` | Select field; `layout` stacked (default) or bar. Caret is the `.form-select` background image |
| `ViewsTheme:Form:Checkbox` | 18px checkbox row (optional title + description) |
| `ViewsTheme:Form:Radio` | 18px radio row (same copy API as Checkbox) |
| `ViewsTheme:Form:Selection` | Card around Checkbox or Radio (`type` `radio` \| `checkbox`) |
| `ViewsTheme:Form:Switch` | 32×20 switch (`form-check form-switch` + `role="switch"`) |
| `ViewsTheme:Form:Slider` | Single- or dual-thumb range slider (native `<input type="range">`) |
| `ViewsTheme:Form:Birthday` | Label + 3× `Form:Select` (day / month / year) |
| `ViewsTheme:Form:Toggle` | Show/hide field group from a switch or select (`data-component`) |
| `ViewsTheme:Form:Handler` | Form owner — Constraint Validation + submit loading (`data-component`) |

`Form:Input` replaces Storefront `component/form/form-input.html.twig` for theme-owned forms. `Form:Select` replaces `component/form/form-select.html.twig`. Theme-owned forms must **not** use core `data-form-*` / `data-validation` / PluginManager form plugins.

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
| `validationRules` | `null` | Comma list. `'required'` → native `required` + `aria-required`. Do **not** emit `data-validation` |
| `confirmFor` | `null` | Id of the field this input must match (`data-confirm-for`). `Form:Handler` sets `setCustomValidity` |
| `confirmMessage` | `null` | Mismatch message (`data-confirm-message`) |
| `violationPath` | `null` | Server violation key (e.g. `'/email'`) |
| `error` | `false` | Force invalid styling without violations |
| `success` | `false` | Force success chrome (`is-valid`). Ignored when the field is invalid |
| `plain` | `false` | Render only the `<input>`. `Form:Input:Group` sets this |
| `formViolations` | `__context.formViolations\|default(null)` | Ambient outer-scope default in `{% props %}` |
| `cva` | `{}` | Slot class overrides |

## Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-group d-flex flex-column` | `class="…"` |
| label | `form-label` + inline flex, gap 4px | `label:class` |
| required | `form-required-label` (color `--primary`) | `required:class` |
| input | `form-control` (+ size / `is-invalid` / `is-valid`) | `input:class` |
| description | `form-text` (12px ash; danger when invalid, success when valid) | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

Chrome for padding, type, radius, border, placeholder, disabled, label, hint, caret, and the invalid icon is Bootstrap variables in `scss/override.scss` (`$input-*`, `$form-label-*`, `$form-text-*`, `$form-feedback-icon-invalid`, `$form-select-indicator`). `scss/_form.scss` keeps the input-group shell, the 1.5px focus width, the soft invalid/valid fills, and the check icon on `.is-valid` only.

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
| `Account:Login` | `Form:Handler` + `Form:Input`; unique per-instance ids; forwards via `username:*` / `password:*` spread ([account-action](account-action.md#accountlogin-field-forwarding)) |
| `Cart:PromotionForm` | Uses `Form:Input:Group` + `Button` in `append` ([cart-drawer](cart-drawer.md#promotion-form)) |
| `Cart:ShippingCalculation:*` | Uses `Form:Select` via `:options` + `:value` ([cart-drawer](cart-drawer.md#shipping-calculation)) |
| `Filter:Boolean` | Uses `Form:Switch` inside bar chip ([filters.md](filters.md)) |
| `Filter:Range` | Uses `Form:Slider` (`mode=range`) under min/max fields ([filters.md](filters.md)) |
| `Review:Form` | Uses `Form:Textarea` (+ Input / Select) — [review.md](review.md) |
| `Account:Register`, `Address:*` | Theme `Form:*` in 6-col `Grid` — [checkout-register.md](checkout-register.md) |
| `Checkout:Confirm:Comment` | `Form:Textarea` associated with `#confirmOrderForm` — [checkout-confirm.md](checkout-confirm.md) |

---

## Form:Textarea

Stacked textarea: optional label + `<textarea>` + description / feedback. Same violation / description API as `Form:Input`. Does **not** own `<form>` or JS.

### Usage

```twig
<twig:ViewsTheme:Form:Textarea
    id="reviewContent"
    name="content"
    label="{{ 'detail.reviewContentLabel'|trans|sw_sanitize }}"
    :rows="5"
    validationRules="required"
    violationPath="/content"
/>
```

### Props

| Prop | Default | Notes |
|------|---------|--------|
| `id` | `null` | Required at call site |
| `name` | `null` | Required at call site |
| `label` | `null` | Label text (HTML allowed; prefer sanitized) |
| `value` | `null` | Text body |
| `placeholder` | `null` | |
| `rows` | `4` | Native `rows` |
| `minlength` / `maxlength` | `null` | |
| `disabled` | `false` | Use `false` not `null` in defaults |
| `size` | `null` | `sm` / `md` / `lg` → `form-control-*` |
| `description` | `null` | Help text under the field |
| `validationRules` | `null` | Comma list. `'required'` → native `required` + `aria-required` |
| `violationPath` | `null` | Server violation key |
| `error` | `false` | Force invalid styling without violations |
| `formViolations` | `__context.formViolations\|default(null)` | Ambient outer-scope default in `{% props %}` |
| `cva` | `{}` | Slot class overrides |

### Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-group d-flex flex-column` | `class="…"` |
| label | `form-label` + inline flex, gap 4px | `label:class` |
| required | `form-required-label` | `required:class` |
| textarea | `form-control` (112px min height, `--spacing-4` padding; + size / `is-invalid`) | `textarea:class` |
| description | `form-text` | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

Nested attrs: `label:*`, `textarea:*`, `description:*`, `feedback:*`.

---

## Form:Input:Group

Joined field shell: optional label + one bordered `.input-group` (prepend / plain `Form:Input` / append) + description / feedback. The shell has no fixed height; it wraps the nested control’s padding. The nested input is `plain` (no own border, label, or status icons). Focus, error, and disabled paint the **outer** shell; the append button stays flush (no radius, stretches with the field). Disabled append fill is linen with ash text. Does **not** own `<form>` or JS.

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

Same field props as `Form:Input` (intentional **facade**: flat control props forward into nest `input` so callers can use `placeholder` / `field:placeholder` without `input:placeholder`). `size` is forwarded to the nested control (`form-control-sm` / `form-control-lg` change `padding-block`). The `.input-group` shell wraps that padding. See [no parallel chrome props](../conventions/ux-components.md#no-parallel-chrome-props-leaf-api) — Group is the documented exception.

### Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-group` | `class="…"` |
| label | `form-label` | `label:class` |
| required | `form-required-label` | `required:class` |
| group | `input-group` (shell wraps the field padding) | `group:class` |
| input | (forwarded to nested `Form:Input` `input:class`) | `input:class` |
| description | `form-text` | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

### Blocks

| Block | Default |
|-------|---------|
| `label` | Optional label (+ required marker) |
| `group` | Bordered shell wrapping prepend / input / append |
| `prepend` | Empty — put leading addons / buttons here |
| `input` | Nested plain `Form:Input` |
| `append` | Empty — put trailing addons / `Button` here |
| `description` / `feedback` | Same idea as `Form:Input` |

Nested attrs: `label:*`, `group:*`, `input:*`, `description:*`, `feedback:*`.

Inside a parent `<twig:block name="append">`, Group shadows parent locals. Use **`vi_define_cva` / `vi_class`** and **`vi_define_attrs` / `vi_attrs`** (stack). See [vi-cva](../twig/vi-cva.md) · [vi-attrs](../twig/vi-attrs.md).

---

## Form:Select

Select field: optional label + `<select>` + description / feedback. Does **not** own `<form>` or JS. Default `layout` is stacked (label above control); `bar` is root-only flex utilities.

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

{# Bar — root inline flex (label margin unchanged) #}
<twig:ViewsTheme:Form:Select
    layout="bar"
    id="sort"
    name="sort"
    label="{{ 'detail.reviewSortLabel'|trans|sw_sanitize }}"
    :options="selectOptions"
    :value="value"
    size="sm"
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
| `options` | `[]` | Iterable of `{ value, label, disabled?, selected?, title? }` |
| `value` | `null` | Selected value (preferred over per-option `selected`) |
| `size` | `null` | `sm` / `md` / `lg` → `form-select-*` |
| `layout` | `'stacked'` | `'bar'` \| `'stacked'` → root CVA only |
| `autocomplete` | `null` | |
| `disabled` | `false` | |
| `description` | `null` | Help text under the field |
| `validationRules` | `null` | Comma list. `'required'` → native `required` + `aria-required` |
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
| `title` | no | `<option title>` when set |

### Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `form-group d-flex flex-wrap` (+ layout: `stacked` column, `bar` row + `gap-2`) | `class="…"` |
| label | `form-label` (+ size `sm → fs-6`) | `label:class` |
| required | `form-required-label` | `required:class` |
| select | `form-select appearance-none` (+ size / `is-invalid` / empty → `is-placeholder` / `bar` → `col`). Caret is the `.form-select` background image (`caret-down`) | `select:class` |
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

## Form:Checkbox

18px checkbox row. Presentational (no `data-component`). The box is a wrapper; the white mark is a `--svg` mask on `.form-check-input` (a heavier check than `check-bold`). Unchecked fill is linen; checked fill is `--primary`. Disabled: ivory, 1.5px linen edge, no check, copy ash. Error (unchecked): white, 1.5px danger edge, no check, danger hint.

`label` is 14px when it is the only line. When `description` is set, `label` is 16px / 600 and `description` is 14px. `embedded` renders a `div` instead of a `label` so `Form:Selection` can own the card label.

## Form:Radio

Same row and copy API as `Form:Checkbox`. The 7px white dot is a `--svg` circle mask on `.form-check-input`, centered in the 18px box. Unchecked fill is linen; checked fill is `--primary`. Disabled hides the dot.

## Form:Selection

Card that embeds `Form:Radio` or `Form:Checkbox` (`type` `radio` or `checkbox`, `embedded`). The card is the single `<label>`. Checked chrome is CSS `:has(input:checked)`: coral-soft fill and a `--primary` border. Unchecked: white, linen border, radius 10px, padding 12px 14px. Optional `price` is trailing 16px / 600.

```twig
<twig:ViewsTheme:Form:Selection
    type="radio"
    id="shipping-standard"
    name="shipping"
    value="standard"
    label="Standard"
    description="Delivered in 3–5 days"
    price="€0.00"
/>
```

| Prop | Default | Notes |
|------|---------|--------|
| `type` | `'radio'` | `'radio'` \| `'checkbox'` |
| `id` | `vi-form-selection-{random}` | Forwarded to the inner control |
| `name` / `value` | `null` / `'1'` | Native grouping for radios |
| `label` / `description` | `null` | Title and supporting line |
| `price` | `null` | Trailing text; omitted when empty |
| `checked` / `disabled` | `false` | |
| `validationRules` / `violationPath` / `error` / `formViolations` | same as Checkbox | |

## Form:Switch

32×20 switch (`form-check form-switch` + `role="switch"`). Track is linen with an ink knob when off, `--primary` with a white knob when on. Disabled track opacity is 0.5 and the label is ash. Presentational only (no `data-component` / JS). Dense bar layout is **caller-owned** via root `class` / nest attrs — no layout prop.

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
| `validationRules` | `null` | `'required'` → native `required` + `aria-required` |
| `violationPath` / `error` / `formViolations` | same as Input | Optional invalid chrome |
| `cva` | `{}` | |

### Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `vi-form-switch form-check form-switch d-inline-flex align-items-center gap-3 m-0 p-0` | `class="…"` |
| input | `form-check-input cursor-pointer` (+ `is-invalid`) | `input:class` |
| label | `form-check-label cursor-pointer` | `label:class` |
| description | `form-text` | `description:class` |
| feedback | `form-field-feedback` | `feedback:class` |

Nested attrs: `input:*`, `label:*`, `description:*`, `feedback:*`.

Co-located `Switch.css`: track, knob, and disabled label color. Theme BS form-check/switch float and negative-margin neutralize: `app/storefront/src/scss/_form.scss`.

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
| `--vi-thumb-size` / `--vi-thumb-bg` / `--vi-thumb-border` / `--vi-thumb-shadow` | Thumb base |
| `--vi-thumb-hover-border-color` / `--vi-thumb-hover-shadow` | Thumb hover (`border-color` direct; no token assign) |
| `--vi-thumb-active-shadow` | Thumb while dragging |
| `--vi-thumb-focus` | Thumb `:focus-visible` ring |

Track/fill colors default via CVA (`bg-light` / `bg-primary`). Theme may override the BEM host if needed.

Co-located: `Form/Slider.css` (non-utility only).

### Call sites

| Consumer | Status |
|----------|--------|
| `Filter:Range` | `mode="range"` under price fields — [filters.md](filters.md) |

## Form:Birthday

Class component. Label + 3× `Form:Select` (day / month / year). Root `g-col-6`; inner `Grid` `columns="3"`. Names `birthdayDay` / `birthdayMonth` / `birthdayYear` (optional `prefix`). Option lists are built in `Birthday.php`.

## Form:Toggle

`data-component="ViewsTheme:Form:Toggle"`. Owns **control** + **content** blocks (content is a `fieldset`). `value` = show when the control matches. Show/hide via `hidden` / `inert` / `disabled`. Hidden fields drop `required` (restored on show) via `@views-theme/modules/shared/form.js` (`setFieldEnabled`, WeakMap — no `data-*` bookkeeping). Nested toggles call `sync()` on inner instances. Driven by `Form:Switch` / `Form:Select`. No CSS/class targets.

| Prop | Default | Notes |
|------|---------|--------|
| `value` | `'1'` | Control value that reveals content |
| `open` | `false` | Initial visibility (JS `sync()` still runs) |

## Form:Handler

Is the `<form>`. Constraint Validation + `confirmFor` match + Bootstrap `is-invalid` / `aria-invalid` chrome (`setInvalidChrome`). Includes **associated** controls (`form="id"` outside the `<form>`): live chrome, `checkValidity`, and submit loading. On valid submit: `setSubmitting(true)` (`disabled` + `aria-busy` on `button[type=submit]`), emit `ViewsTheme:Form:Handler:Submit`. Invalid (or `preventNative`) calls `preventDefault`. The native path does **not** call `HTMLFormElement.prototype.submit()` — the same `submit` event continues so core captcha plugins (capture listeners that attach a token, then `form.submit()`) can run. `preventNative` callers (`Review:Form`) must call `setSubmitting(false)` when the async save finishes (or is replaced).

| Prop | Default | Notes |
|------|---------|--------|
| `action` / `method` | `null` / `'post'` | Form attrs |
| `preventNative` | `false` | `Review:Form` sets `true` and listens for `Submit` |

Public JS: `setSubmitting(boolean)`.

Do **not** mount core `FormHandler` / `FormValidation` / `data-form-handler` / `window.formValidation`.

## Related

- [UX components](../conventions/ux-components.md)
- [Checkout register](checkout-register.md)
- [Checkout confirm](checkout-confirm.md)
- [Account action](account-action.md) (login in header menu)
- [Cart drawer](cart-drawer.md) (promotion form, shipping calculation)
- [Filters](filters.md) (`Filter:Boolean`, `Filter:Range`)
- [Newsletter](newsletter.md) (`Newsletter:Form` posts through `Form:Handler`)
