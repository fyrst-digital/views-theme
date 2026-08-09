# Account action

Header account control: domain `Account:Action` composed with the generic `Dropdown` primitive (default `Button` toggle) and `Account:Menu` panel body.

## Composition

```
Page:Header:Actions
  └─ Account:Action
       └─ Dropdown
            └─ host (vi-dropdown-host; header: --lg-up)
                 ├─ toggle → Button (icon=user, optional label)
                 └─ panel (popover) → Account:Menu
                      ├─ guest → Login → Login:Actions (Button submit + recover)
                      │         + register CTA
                      └─ customer → Account:Actions
```

| Component | Path | Role |
|-----------|------|------|
| `Account:Action` | `components/Account/Action.*` | Action shell; toggle chrome via Dropdown nest `toggle:*` |
| `Dropdown` | `components/Dropdown.*` | Open/close, anchor placement, `aria-expanded`; default toggle is `Button` |
| `Button` | `components/Button.*` | Default toggle control |
| `Account:Menu` | `components/Account/Menu.*` | Account panel body (no dropdown chrome); nest `register` for CTA Button |
| `Account:Actions` | `components/Account/Actions.*` | Logged-in nav links (`Button` + `activeRoute`) |
| `Account:Login` | `components/Account/Login.*` | Login form (`Form:Input` fields + actions) |
| `Account:Login:Actions` | `components/Account/Login/Actions.*` | Login submit + recover; nests `login` / `recovery` |
| `Form:Input` | `components/Form/Input.*` | Shared text field (label, validation, violations) |

## Dropdown behavior

- **DOM:** Host wrapper `vi-dropdown-host` (`display: contents`) → default toggle `Button` + panel popover. `data-component` on the **host**; panel keeps `class` / root CVA (`vi-dropdown`)
- **Open/close:** HTML Popover (`popover="auto"` + `popovertarget` on the Button) — Escape and outside click included
- **Placement:** CSS only — `anchor-name` / `position-anchor` / `anchor()` via `placement` prop (`bottom-end` default). Values: `bottom-start` \| `bottom-center` \| `bottom-end` \| `top-start` \| `top-end`. No JS positioning
- **Slots:** default `toggle` is Dropdown-owned `Button`; chrome only via nest `toggle:*` (defaults: `color: none`, `size: md`, optional `icon` / `label`). Override the whole `toggle` block for rich chrome (see Language/Currency). Default `content` = panel body
- **JS (a11y only):** host root; finds panel `[popover]` + toggle `[popovertarget]`; syncs `aria-expanded` only
- **Responsive hide:** `host:class="vi-dropdown-host--lg-up"` hides host + force-dismisses open panel below `lg` (no anchor jump)
- **Composition:** `class` → panel, `toggle:class` → Button, `host:class` → host; other attrs via `attributes.defaults` (**no** `class` in defaults; **no** parallel chrome props)
- **Visible label:** `toggle:label` defaults to `account.myAccount`; `:toggle:label="false"` hides it (icon-only). Button label classes via `toggle:label:class`
- **Header wire-up:** `host:class="vi-dropdown-host--lg-up"`, `toggle:class="header-action icon-size-3 icon-size-lg-4"`, `:toggle:label="false"`
- **Build:** from Shopware root — `make build-storefront`

## Account-specific a11y

- Toggle: `aria-haspopup="dialog"`, `aria-label` / `title` from `account.myAccount` (kept when icon-only or with visible label)
- Guest menu root: `role="dialog"` + `aria-label`
- Customer: nav links from `Account:Actions` (no dialog role); `aria-current="page"` when `activeRoute` (default: `app.request` `_route`) matches the action route

## Deprecations

| Legacy shim (still present) | Replacement |
|-----------------------------|-------------|
| `Page:Header:Action:Account` | `Account:Action` |
| `Account:Dropdown` | `Account:Menu` inside `Dropdown` |

Former names `Account:LoginForm` / `Account:UserActions` are gone (use `Account:Login` / `Account:Actions`). No shim files remain for those.

## Wire-up

`Page:Header:Actions` (visible from `lg` up; icon-only):

```twig
<twig:ViewsTheme:Account:Action
    :toggle:label="false"
    class="mt-2 p-0 vi-account__dropdown"
    host:class="vi-dropdown-host--lg-up"
    toggle:class="header-action icon-size-3 icon-size-lg-4"
/>
```

Below `lg`, `vi-dropdown-host--lg-up` hides the host and force-dismisses an open panel (same CSS cascade — no corner jump).

`Navigation:Drawer` title (mobile entry; default label snippet):

```twig
<twig:ViewsTheme:Account:Action
    class="mt-2 p-0 vi-account__dropdown"
    placement="bottom-center"
    toggle:label:class="fs-6"
/>
```

See [Navigation drawer](navigation-drawer.md) and [UX components — Attributes](../conventions/ux-components.md#attributes).

## Account:Login field forwarding

`Account:Login` spreads nested attribute bags into each `Form:Input`:

| Nest | Child |
|------|--------|
| `username:*` | email `Form:Input` |
| `password:*` | password `Form:Input` |

Defaults live in Login (type, id, name, label, placeholder, autocomplete, error, validationRules). Field root classes come from CVA slots `username` / `password` via `class="{{ vi_class('username') }}"` / `vi_class('password')` (not defaults). Field `id`s are unique per instance (`vi-login-{n}-mail` / `-password`) so header menu + login page can coexist. Caller `username:class` / `password:class` merge via CVA; deeper nests pass through (e.g. `username:input:class`).

```twig
<twig:ViewsTheme:Account:Login
    class="p-4 border-bottom"
    :description="false"
    :username:label="false"
    username:placeholder="{{ 'account.loginMailLabel'|trans|sw_sanitize }}"
    :password:label="false"
    password:placeholder="{{ 'account.loginPasswordLabel'|trans|sw_sanitize }}"
/>
```

Use `:username:label="false"` (dynamic) to hide the label — not the string `"false"`.

See [UX components — Attributes](../conventions/ux-components.md#attributes) for DOM vs child-component patterns.

## Related

- [Form input](form-input.md)
- [UX components](../conventions/ux-components.md)
- [JavaScript](../conventions/javascript.md)
