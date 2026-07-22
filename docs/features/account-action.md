# Account action

Header account control: domain `Account:Action` composed with the generic `Dropdown` primitive and `Account:Menu` panel body.

## Composition

```
Page:Header:Actions
  └─ Account:Action
       └─ Dropdown
            ├─ toggle → user icon
            └─ content → Account:Menu
                 ├─ guest → LoginForm + register CTA
                 └─ customer → UserActions
```

| Component | Path | Role |
|-----------|------|------|
| `Account:Action` | `components/Account/Action.*` | Header action shell (size CVA, a11y labels) |
| `Dropdown` | `components/Dropdown.*` | Open/close, anchor placement, a11y focus |
| `Account:Menu` | `components/Account/Menu.*` | Account panel body (no dropdown chrome) |

## Dropdown behavior

- **Open/close:** HTML Popover (`popover="auto"` + `popovertarget`) — Escape and outside click included
- **Placement:** CSS only — `anchor-name` / `position-anchor` / `anchor()` via `placement` prop (`bottom-end` default). No JS positioning
- **Slots:** `toggle` (button content only; Dropdown owns the `<button>`), default `content` (panel body)
- **JS (a11y only):** `aria-expanded` sync; focus first focusable in panel on open; restore focus to toggle on close when focus was inside the panel
- **Styling:** Bootstrap utilities first in `Dropdown.cva.twig` (border, rounded, shadow, bg-body, …). Co-located `Dropdown.css`: popover UA reset + anchor placement only
- **Build:** from Shopware root — `make build-storefront`

## Account-specific a11y

- Toggle: `aria-haspopup="dialog"`, labelled with `account.myAccount`
- Guest menu root: `role="dialog"` + `aria-label`
- Customer: nav links from `Account:UserActions` (no dialog role)

## Deprecations

| Legacy | Replacement |
|--------|-------------|
| `Page:Header:Action:Account` | `Account:Action` |
| `Account:Dropdown` | `Account:Menu` inside `Dropdown` |

Shims remain as thin wrappers with `@deprecated` comments.

## Wire-up

`Page:Header:Actions` renders:

```twig
<twig:ViewsTheme:Account:Action class="header-action" />
```

## Related

- [UX components](../conventions/ux-components.md)
- [JavaScript](../conventions/javascript.md)
