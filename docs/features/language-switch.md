# Language switch

Header / drawer language control: domain `Language:Action` composed with the generic `Dropdown` primitive, a `Button` toggle, and `Language:Menu` panel body.

## Composition

```
layout_top_bar (desktop lg+)
  └─ Language:Action
       └─ Dropdown
            ├─ toggle → Button (prepend flag/code, label, append caret)
            └─ Language:Menu → POST form + option submit buttons

Navigation:Drawer footer (mobile)
  └─ Language:Action (placement=top-start)
```

| Component | Path | Role |
|-----------|------|------|
| `Language:Action` | `components/Language/Action.*` (+ **`Action.php`**) | Class-backed shell: view-model in PHP; owns full `Button` toggle; hidden when ≤1 language |
| `Dropdown` | `components/Dropdown.*` | Host + panel (open/close, anchor placement, `aria-expanded`) |
| `Button` | `components/Button.*` | Toggle control (`color` / `size`; empty `prepend` / `append` blocks) |
| `Language:Menu` | `components/Language/Menu.*` | Panel body: switch form + options (no dropdown chrome) |
| `Language:Flag` | `components/Language/Flag.*` | Flag `<img>` + CSP-safe load error handling (fallback src → remove) |

## Class component

`Language:Action` is a [class UX component](../conventions/ux-components.md#class-components-php-backed):

- `Action.php` — public prop defaults; `#[PostMount]` resolves context defaults (active language id, id), finds active entity, derives `visible`, `ariaName`, `languageCode`, `flagCode` / `flagCodeFallback`
- `Action.html.twig` — composition only (CVA, Dropdown/Button/Menu, `asset()` for flags, `|trans` for aria); toggle chrome via nest `toggle:*`

Must stay registered via the components `**/*.php` service prototype (autoconfigure).

## Props / fields

### Inputs (`Language:Action`)

| Prop | Default (class / PostMount) | Notes |
|------|----------------------|--------|
| `languages` | `[]` if omitted | Call sites pass `header.languages` / drawer `languages` |
| `activeLanguageId` | sales-channel language id | |
| `id` | `vi-language-action-{random}` | Base id for Dropdown + option buttons |
| `showCode` | `false` | Short locale code (e.g. `EN`) in Button `prepend` |
| `showFlag` | `true` | Flag in Button `prepend` |
| `placement` | `'bottom-end'` | Forwarded to `Dropdown` |
| `cva` | `{}` | Deep-merge CVA overrides |

**Nest** `toggle:…` → owned `Button` (defaults: `label: ariaName`, `size: sm`, `color: none`, popover/ARIA). Override: `:toggle:label="false"`, `toggle:size`, …

### Derived (template-facing)

| Field | Notes |
|-------|--------|
| `visible` | `true` when more than one language |
| `ariaName` | Always-on name for title / aria-label |
| `languageCode` | Short upper code for `showCode` |
| `flagCode` / `flagCodeFallback` | For `Language:Flag` asset paths |

### `Language:Menu`

| Prop | Default | Notes |
|------|---------|--------|
| `languages` | `header.languages` → `page.header.languages` | Prop default (anonymous) |
| `activeLanguageId` | `context.context.languageId` | Prop default |
| `id` | `'vi-language-menu-' ~ random()` | Action passes its `id` |
| `showFlag` | `true` | Flag next to each option |
| `cva` | `{}` | Deep-merge |

## Behavior

- **Open/close:** `Dropdown` HTML Popover + CSS anchor
- **Toggle:** Action replaces Dropdown’s default toggle with `ViewsTheme:Button`; chrome via pre-bound `attrs.toggle.defaults` (no parallel `toggleLabel` prop). No multi-hop blocks into Dropdown’s default Button.
- **Switch:** `POST` `frontend.checkout.switch-language` with submit button `name="languageId"`
- **Redirect:** `data-form-add-dynamic-redirect="true"` (core FormAddDynamicRedirect)
- **Locale routes:** hidden `languageCode_{id}` when `_route_params._locale` is set
- **Active option:** CVA `active` variant + `aria-current="true"`
- **Display:** optional flag + optional code in `prepend`; name via Button `label`; `caret-down` in `append`
- **Flags:** [lipis/flag-icons](https://github.com/lipis/flag-icons) **4×3** SVGs under `src/Resources/public/flags/`, named as Shopware `translationCode` (e.g. `de.svg`, `en-US.svg`, `cs.svg`). MIT license in that folder. Rendered via `Language:Flag` (`data-component="ViewsTheme:Language:Flag"`): primary `src`, optional `fallbackSrc` (language segment, e.g. `en-US` → `en.svg`); on `error`, try fallback once then remove the img — no inline handlers. `:showFlag="false"` hides them. Add more locales by copying upstream 4×3 SVGs under the matching code name (`en.svg` uses GB artwork).
- **CSS:** `Language:Flag` owns `d-block` + flag geometry tokens (`Flag.css`: `--vi-flag-w`, `--vi-flag-ar`). `Language/Action.css` keeps `--vi-min-w` only. Theme may assign overrides in `app/storefront/src/css/components.css` (e.g. `--vi-max-w` on the action host for Dropdown). See [CSS custom properties](../conventions/css-classes.md#css-custom-properties-critical)

## Dropdown composition

Same patterns as [Account action](account-action.md):

- `class` → panel, `host:class` → host; toggle is a full `Button` owned by Action
- Pre-bind parent CVA into a `classes` hash and `attrs.toggle` before Dropdown mount (nested `cx` / `attributes` shadowing)
- No `class` inside `attributes.defaults`; no parallel chrome props
- Do **not** nest `{% block %}` inside `<twig:block>` to fill Button slots through Dropdown — Action owns the Button

## Wire-up

Desktop top-bar — `storefront/layout/header/header.html.twig` overrides block `layout_top_bar`:

```twig
<twig:ViewsTheme:Language:Action
    :languages="header.languages"
    placement="bottom-end"
/>
```

Optional stable `id="vi-header-language"`. Toggle is always `Button` `size="sm"` `color="none"`.

Navigation drawer footer — languages passed from `NavigationDrawerController` (via `HeaderPageletLoader`):

```twig
<twig:ViewsTheme:Language:Action
    :languages="languages"
    placement="top-start"
/>
```

## Related

- [Currency switch](currency-switch.md)
- [Account action](account-action.md) (Dropdown composition reference)
- [Navigation drawer](navigation-drawer.md)
- [UX components](../conventions/ux-components.md) · [class components](../conventions/ux-components.md#class-components-php-backed)
