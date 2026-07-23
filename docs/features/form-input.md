# Form input

Reusable text field primitive owned by the theme: `ViewsTheme:Form:Input`.

Replaces Storefront `component/form/form-input.html.twig` for theme-owned forms.

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
| `description` | `null` | Help text under the field |
| `validationRules` | `null` | Comma list → `data-validation` (Storefront form-handler) |
| `violationPath` | `null` | Server violation key (e.g. `'/email'`) |
| `error` | `false` | Force invalid styling without violations |
| `formViolations` | `null` | Falls back to `_context.formViolations` |
| `cva` | `{}` | Slot class overrides |

## Classes / slots

| Slot | Default base | Caller override |
|------|--------------|-----------------|
| root | `vi-form-input form-group` | `class="…"` |
| label | `vi-form-input__label form-label` | `label:class` |
| required | `vi-form-input__required form-required-label` | `required:class` |
| input | `vi-form-input__control form-control` (+ `is-invalid`) | `input:class` |
| description | `vi-form-input__description form-text` | `description:class` |
| feedback | `vi-form-input__feedback form-field-feedback` | `feedback:class` |

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
| `Account:Register`, `Address:*` | Still core `form-input` include |

## Related

- [UX components](../conventions/ux-components.md)
- [Account action](account-action.md) (login in header menu)
