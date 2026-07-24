# Account action

Header account control: domain `Account:Action` composed with the generic `Dropdown` primitive and `Account:Menu` panel body.

## Composition

```
Page:Header:Actions
  └─ Account:Action
       └─ Dropdown (flat: button + panel, no wrapper)
            ├─ toggle button → user icon
            └─ panel (host) → Account:Menu
                 ├─ guest → Login → Login:Actions (Button submit + recover)
                 │         + register CTA
                  └─ customer → Account:Actions
```

| Component | Path | Role |
|-----------|------|------|
| `Account:Action` | `components/Account/Action.*` | Header action shell (size CVA, a11y labels) |
| `Dropdown` | `components/Dropdown.*` | Open/close, anchor placement, `aria-expanded` |
| `Account:Menu` | `components/Account/Menu.*` | Account panel body (no dropdown chrome) |
| `Account:Actions` | `components/Account/Actions.*` | Logged-in nav links (`Button` + `activeRoute`) |
| `Account:Login` | `components/Account/Login.*` | Login form (`Form:Input` fields + actions) |
| `Account:Login:Actions` | `components/Account/Login/Actions.*` | Login submit + recover (`Button`) |
| `Form:Input` | `components/Form/Input.*` | Shared text field (label, validation, violations) |

## Dropdown behavior

- **DOM:** Flat siblings — `<button class="vi-dropdown__toggle">` + `<div class="vi-dropdown" popover>` (no wrapper). Root attrs / root CVA / `data-component` on the **panel**
- **Open/close:** HTML Popover (`popover="auto"` + `popovertarget`) — Escape and outside click included
- **Placement:** CSS only — `anchor-name` / `position-anchor` / `anchor()` via `placement` prop (`bottom-end` default). No JS positioning
- **Slots:** `toggle` (button content), default `content` (panel body)
- **JS (a11y only):** host is the panel; finds toggle via `[popovertarget]`; syncs `aria-expanded` only (no focus moves)
- **Styling:** Bootstrap utilities first in `Dropdown.cva.twig`. Co-located `Dropdown.css`: popover UA reset + anchor placement only
- **Composition:** `Account:Action` spreads into `Dropdown` via `{{ ...attributes.defaults({…}).all() }}` (placement, `toggle:*`, `class`). Callers override without parallel props on Account
- **Header wire-up:** `toggle:class="header-action"` (icon chrome on the button, not the panel)
- **Build:** from Shopware root — `make build-storefront`

## Account-specific a11y

- Toggle: `aria-haspopup="dialog"`, labelled with `account.myAccount`
- Guest menu root: `role="dialog"` + `aria-label`
- Customer: nav links from `Account:Actions` (no dialog role); `aria-current="page"` when `activeRoute` (default: `app.request` `_route`) matches the action route

## Deprecations

| Legacy | Replacement |
|--------|-------------|
| `Page:Header:Action:Account` | `Account:Action` |
| `Account:Dropdown` | `Account:Menu` inside `Dropdown` |
| `Account:LoginForm` | `Account:Login` |
| `Account:UserActions` | `Account:Actions` |

Shims remain as thin wrappers with `@deprecated` comments where kept.

## Wire-up

`Page:Header:Actions` (visible from `lg` up):

```twig
<twig:ViewsTheme:Account:Action
    class="mt-2 p-0 vi-account__dropdown"
    toggle:class="header-action d-none d-lg-inline-flex"
/>
```

`Navigation:Drawer` title (mobile entry). `placement` / `toggle:*` forward to `Dropdown` via attributes defaults (`bottom-start` so the panel opens into the drawer):

```twig
<twig:ViewsTheme:Account:Action
    class="p-0 vi-account__dropdown"
    placement="bottom-start"
    toggle:class="header-action"
/>
```

See [Navigation drawer](navigation-drawer.md) and [UX components — Attributes](../conventions/ux-components.md#attributes).

## Account:Login field forwarding

`Account:Login` spreads nested attribute bags into each `Form:Input`:

| Nest | Child |
|------|--------|
| `username:*` | email `Form:Input` |
| `password:*` | password `Form:Input` |

Defaults live in Login (type, id, name, label, placeholder, autocomplete, error, validationRules, class). Field `id`s are unique per instance (`vi-login-{n}-mail` / `-password`) so header menu + login page can coexist. Caller keys override; `class` concatenates. Deeper nests pass through (e.g. `username:input:class`).

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
