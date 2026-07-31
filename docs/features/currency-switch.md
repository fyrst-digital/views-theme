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
| `Currency:Action` | `components/Currency/Action.*` (+ **`Action.php`**) | Class-backed shell: view-model in PHP; owns full `Button` toggle; hidden when ≤1 currency |
| `Dropdown` | `components/Dropdown.*` | Host + panel (open/close, anchor placement, `aria-expanded`) |
| `Button` | `components/Button.*` | Toggle control (`color` / `size`; empty `prepend` / `append` blocks) |
| `Currency:Menu` | `components/Currency/Menu.*` | Panel body: configure form + options (no dropdown chrome) |

## Class component

`Currency:Action` is a [class UX component](../conventions/ux-components.md#class-components-php-backed):

- `Action.php` — public prop defaults; `#[PostMount]` resolves context defaults (active currency id, id), derives `visible`, `ariaName`, `currencySymbol`
- `Action.html.twig` — composition only (CVA, Dropdown/Button/Menu, `|trans` for aria); toggle chrome via nest `toggle:*`

Must stay registered via the components `**/*.php` service prototype (autoconfigure).

## Props / fields

### Inputs (`Currency:Action`)

| Prop | Default (class / PostMount) | Notes |
|------|----------------------|--------|
| `currencies` | `[]` if omitted | Call sites pass `header.currencies` / drawer `currencies` |
| `activeCurrencyId` | context currency id | |
| `id` | `vi-currency-action-{random}` | Base id for Dropdown + option buttons |
| `showSymbol` | `true` | Currency symbol in Button `prepend` |
| `placement` | `'bottom-end'` | Forwarded to `Dropdown` |
| `cva` | `{}` | Deep-merge CVA overrides |

**Nest** `toggle:…` → owned `Button` (defaults: `label: ariaName`, `size: sm`, `color: none`, popover/ARIA). Override: `:toggle:label="false"`, …

### Derived (template-facing)

| Field | Notes |
|-------|--------|
| `visible` | `true` when more than one currency |
| `ariaName` | Always-on name for title / aria-label |
| `currencySymbol` | Context currency symbol |

### `Currency:Menu`

| Prop | Default | Notes |
|------|---------|--------|
| `currencies` | same as Action call-site defaults | Prop default (anonymous) |
| `activeCurrencyId` | `context.currency.id` | Prop default |
| `id` | `'vi-currency-menu-' ~ random()` | Action passes its `id` |
| `cva` | `{}` | Deep-merge |

## Behavior

- **Open/close:** `Dropdown` HTML Popover + CSS anchor (no currency-specific JS)
- **Toggle:** Action replaces Dropdown’s default toggle with `ViewsTheme:Button`; chrome via pre-bound `attrs.toggle.defaults` (no parallel `toggleLabel` prop)
- **Switch:** `POST` `frontend.checkout.configure` with submit button `name="currencyId"`
- **Redirect:** `data-form-add-dynamic-redirect="true"`
- **Active option:** CVA `active` variant + `aria-current="true"`
- **Display:** optional symbol in `prepend`; name via Button `label`; `caret-down` in `append`
- **CSS:** co-located `Currency/Action.css` + `Currency/Menu.css` — consume tokens with fallbacks only (`var(--vi-min-w, 10rem)`, `var(--vi-symbol-min-w, 20px)`, …). Theme may assign overrides in `app/storefront/src/css/components.css` (e.g. `--vi-max-w` on the action host for Dropdown). See [CSS custom properties](../conventions/css-classes.md#css-custom-properties-critical)

## Dropdown composition

Same patterns as [Account action](account-action.md) / [Language switch](language-switch.md):

- `class` → panel, `host:class` → host; toggle is a full `Button` owned by Action
- Pre-bind parent CVA into a `classes` hash and `attrs.toggle` before Dropdown mount (nested `cx` / `attributes` shadowing)
- No `class` inside `attributes.defaults`; no parallel chrome props
- Do **not** multi-hop blocks through Dropdown into Button

## Wire-up

Desktop top-bar — `storefront/layout/header/header.html.twig` overrides block `layout_top_bar`:

```twig
<twig:ViewsTheme:Currency:Action
    :currencies="header.currencies"
    placement="bottom-end"
/>
```

Optional stable `id="vi-header-currency"`. Toggle is always `Button` `size="sm"` `color="none"`.

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
- [UX components](../conventions/ux-components.md) · [class components](../conventions/ux-components.md#class-components-php-backed)
