# Currency switch

Header / drawer currency control: domain `Currency:Action` composed with the generic `Dropdown` primitive and `Currency:Menu` panel body.

## Composition

```
layout_top_bar (desktop lg+)
  └─ Currency:Action
       └─ Dropdown
            ├─ toggle → symbol + active currency name
            └─ Currency:Menu → POST form + option submit buttons

Navigation:Drawer footer (mobile)
  └─ Currency:Action (position=offcanvas, placement=top-start)
```

| Component | Path | Role |
|-----------|------|------|
| `Currency:Action` | `components/Currency/Action.*` | Shell: resolve currencies/active, Dropdown chrome, a11y; hidden when ≤1 currency |
| `Dropdown` | `components/Dropdown.*` | Open/close, anchor placement, `aria-expanded` |
| `Currency:Menu` | `components/Currency/Menu.*` | Panel body: configure form + options (no dropdown chrome) |

## Props

### `Currency:Action`

| Prop | Default | Notes |
|------|---------|--------|
| `currencies` | `null` | Fallback: `header.currencies` → `page.header.currencies` |
| `activeCurrencyId` | `null` | Fallback: `context.currency.id` |
| `position` | `'top-bar'` | Option element id prefix only (`top-bar` / `offcanvas`); no redirect side effects |
| `size` | `'md'` | Toggle CVA size |
| `label` | `null` | Default: `context.currency.translated.name`; `:label="false"` hides text |
| `showSymbol` | `true` | Currency symbol before label |
| `placement` | `'bottom-end'` | Forwarded to `Dropdown` |
| `cva` | `{}` | Deep-merge CVA overrides |

### `Currency:Menu`

| Prop | Default | Notes |
|------|---------|--------|
| `currencies` | `null` | Same fallbacks as Action |
| `activeCurrencyId` | `null` | Same fallbacks as Action |
| `position` | `'top-bar'` | Option element id prefix only |
| `cva` | `{}` | Deep-merge |

## Behavior

- **Open/close:** `Dropdown` HTML Popover + CSS anchor (no currency-specific JS)
- **Switch:** `POST` `frontend.checkout.configure` with submit button `name="currencyId"`
- **Redirect:** `data-form-add-dynamic-redirect="true"`

- **Active option:** CVA `active` variant + `aria-current="true"`
- **Toggle:** symbol (`aria-hidden`) + translated name + `caret-down` icon
- **CSS:** co-located `Currency/Action.css` — consume tokens with fallbacks only (`var(--currency-action-min-width, 10rem)`, …). Theme may assign overrides in `app/storefront/src/css/components.css` (e.g. `--dropdown-max-width`). See [CSS custom properties](../conventions/css-classes.md#css-custom-properties-critical)

## Dropdown composition

Same patterns as [Account action](account-action.md) / [Language switch](language-switch.md):

- `class` → panel, `toggle:class` → button, `host:class` → host
- Pre-bind parent `cx` slots (`label`, `symbol`) before Dropdown mount
- No `class` inside `attributes.defaults`

## Wire-up

Desktop top-bar — `storefront/layout/header/header.html.twig` overrides block `layout_top_bar`:

```twig
<twig:ViewsTheme:Currency:Action
    :currencies="header.currencies"
    position="top-bar"
    placement="bottom-end"
    toggle:class="top-bar-nav-btn btn-sm"
/>
```

Navigation drawer footer — currencies passed from `NavigationDrawerController` (via `HeaderPageletLoader`):

```twig
<twig:ViewsTheme:Currency:Action
    :currencies="currencies"
    position="offcanvas"
    placement="top-start"
    toggle:class="btn-sm"
/>
```

## Related

- [Language switch](language-switch.md)
- [Account action](account-action.md)
- [Navigation drawer](navigation-drawer.md)
- [UX components](../conventions/ux-components.md)
