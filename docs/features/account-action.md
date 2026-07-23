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
                 └─ customer → UserActions
```

| Component | Path | Role |
|-----------|------|------|
| `Account:Action` | `components/Account/Action.*` | Header action shell (size CVA, a11y labels) |
| `Dropdown` | `components/Dropdown.*` | Open/close, anchor placement, a11y focus |
| `Account:Menu` | `components/Account/Menu.*` | Account panel body (no dropdown chrome) |
| `Account:Login:Actions` | `components/Account/Login/Actions.*` | Login submit + recover (`Button`) |

## Dropdown behavior

- **DOM:** Flat siblings — `<button class="vi-dropdown__toggle">` + `<div class="vi-dropdown" popover>` (no wrapper). Root attrs / root CVA / `data-component` on the **panel**
- **Open/close:** HTML Popover (`popover="auto"` + `popovertarget`) — Escape and outside click included
- **Placement:** CSS only — `anchor-name` / `position-anchor` / `anchor()` via `placement` prop (`bottom-end` default). No JS positioning
- **Slots:** `toggle` (button content), default `content` (panel body)
- **JS (a11y only):** host is the panel; finds toggle via `[popovertarget]`; syncs `aria-expanded` and focus
- **Styling:** Bootstrap utilities first in `Dropdown.cva.twig`. Co-located `Dropdown.css`: popover UA reset + anchor placement only
- **Header wire-up:** `toggle:class="header-action"` (icon chrome on the button, not the panel)
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
<twig:ViewsTheme:Account:Action toggle:class="header-action" />
```

## Related

- [UX components](../conventions/ux-components.md)
- [JavaScript](../conventions/javascript.md)
