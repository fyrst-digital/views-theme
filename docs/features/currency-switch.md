# Currency switch

Header / drawer currency control: domain `Currency:Action` composed with the generic `Dropdown` primitive, a `Button` toggle, and `Currency:Menu` panel body.

## Composition

```
layout_top_bar (desktop lg+)
  └─ Currency:Action
       └─ Dropdown
            ├─ toggle → Button (prepend symbol, label, append caret)
            └─ Currency:Menu → POST form + option submit buttons

Navigation:Drawer footer (mobile)
  └─ Currency:Action (placement=top-start)
```

| Component | Path | Role |
|-----------|------|------|
| `Currency:Action` | `components/Currency/Action.*` | Shell: resolve currencies/active; owns full `Button` toggle override; hidden when ≤1 currency |
| `Dropdown` | `components/Dropdown.*` | Host + panel (open/close, anchor placement, `aria-expanded`) |
| `Button` | `components/Button.*` | Toggle control (`color` / `size`; empty `prepend` / `append` blocks) |
| `Currency:Menu` | `components/Currency/Menu.*` | Panel body: configure form + options (no dropdown chrome) |

## Props

### `Currency:Action`

| Prop | Default | Notes |
|------|---------|--------|
| `currencies` | `null` | Fallback: `header.currencies` → `page.header.currencies` |
| `activeCurrencyId` | `null` | Fallback: `context.currency.id` |
| `id` | `null` | Base id for Dropdown + option buttons (`{id}-{currencyId}`). Default: `vi-currency-action-{random}` |
| `label` | `null` | Default: `context.currency.translated.name`; `:label="false"` hides text |
| `showSymbol` | `true` | Currency symbol in Button `prepend` |
| `placement` | `'bottom-end'` | Forwarded to `Dropdown` |
| `cva` | `{}` | Deep-merge CVA overrides |

### `Currency:Menu`

| Prop | Default | Notes |
|------|---------|--------|
| `currencies` | `null` | Same fallbacks as Action |
| `activeCurrencyId` | `null` | Same fallbacks as Action |
| `id` | `null` | Base for option button ids (`{id}-{currencyId}`). From Action, or `vi-currency-menu-{random}` |
| `cva` | `{}` | Deep-merge |

## Behavior

- **Open/close:** `Dropdown` HTML Popover + CSS anchor (no currency-specific JS)
- **Toggle:** Action replaces Dropdown’s default toggle with `ViewsTheme:Button` (`size="sm"` `color="white"`, hard attrs for popover/ARIA)
- **Switch:** `POST` `frontend.checkout.configure` with submit button `name="currencyId"`
- **Redirect:** `data-form-add-dynamic-redirect="true"`
- **Active option:** CVA `active` variant + `aria-current="true"`
- **Display:** optional symbol in `prepend`; name via Button `label`; `caret-down` in `append`
- **CSS:** co-located `Currency/Action.css` + `Currency/Menu.css` — consume tokens with fallbacks only (`var(--vi-min-w, 10rem)`, `var(--vi-symbol-min-w, 20px)`, …). Theme may assign overrides in `app/storefront/src/css/components.css` (e.g. `--vi-max-w` on the action host for Dropdown). See [CSS custom properties](../conventions/css-classes.md#css-custom-properties-critical)

## Dropdown composition

Same patterns as [Account action](account-action.md) / [Language switch](language-switch.md):

- `class` → panel, `host:class` → host; toggle is a full `Button` owned by Action (hardcoded `sm` / `white`)
- Pre-bind parent `cx` slots / `buttonLabel` before Dropdown mount (nested name shadowing)
- No `class` inside `attributes.defaults`
- Do **not** multi-hop blocks through Dropdown into Button

## Wire-up

Desktop top-bar — `storefront/layout/header/header.html.twig` overrides block `layout_top_bar`:

```twig
<twig:ViewsTheme:Currency:Action
    :currencies="header.currencies"
    placement="bottom-end"
/>
```

Optional stable `id="vi-header-currency"`. Toggle is always `Button` `size="sm"` `color="white"`.

Navigation drawer footer — currencies passed from `NavigationDrawerController` (via `HeaderPageletLoader`):

```twig
<twig:ViewsTheme:Currency:Action
    :currencies="currencies"
    placement="top-start"
/>
```

## Related

- [Language switch](language-switch.md)
- [Account action](account-action.md)
- [Navigation drawer](navigation-drawer.md)
- [UX components](../conventions/ux-components.md)
