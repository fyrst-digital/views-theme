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
| `Language:Action` | `components/Language/Action.*` | Shell: resolve languages/active; owns full `Button` toggle override; hidden when ≤1 language |
| `Dropdown` | `components/Dropdown.*` | Host + panel (open/close, anchor placement, `aria-expanded`) |
| `Button` | `components/Button.*` | Toggle control (`color` / `size`; empty `prepend` / `append` blocks) |
| `Language:Menu` | `components/Language/Menu.*` | Panel body: switch form + options (no dropdown chrome) |
| `Language:Flag` | `components/Language/Flag.*` | Flag `<img>` + CSP-safe load error handling (fallback src → remove) |

## Props

### `Language:Action`

| Prop | Default | Notes |
|------|---------|--------|
| `languages` | `null` | Fallback: `header.languages` → `page.header.languages` |
| `activeLanguageId` | `null` | Fallback: `context.context.languageId` |
| `id` | `null` | Base id for Dropdown + option buttons (`{id}-{languageId}`). Default: `vi-language-action-{random}` |
| `label` | `null` | Default: `context.languageInfo.name`; `:label="false"` hides text |
| `showCode` | `false` | Short locale code (e.g. `EN`) in Button `prepend` |
| `showFlag` | `true` | Flag in Button `prepend` from `bundles/viewstheme/flags/{translationCode}.svg` |
| `placement` | `'bottom-end'` | Forwarded to `Dropdown` |
| `cva` | `{}` | Deep-merge CVA overrides |

### `Language:Menu`

| Prop | Default | Notes |
|------|---------|--------|
| `languages` | `null` | Same fallbacks as Action |
| `activeLanguageId` | `null` | Same fallbacks as Action |
| `id` | `null` | Base for option button ids (`{id}-{languageId}`). From Action, or `vi-language-menu-{random}` |
| `showFlag` | `true` | Flag next to each option |
| `cva` | `{}` | Deep-merge |

## Behavior

- **Open/close:** `Dropdown` HTML Popover + CSS anchor
- **Toggle:** Action replaces Dropdown’s default toggle with `ViewsTheme:Button` (`size="sm"` `color="white"`, hard attrs for popover/ARIA). No multi-hop blocks into Dropdown’s default Button.
- **Switch:** `POST` `frontend.checkout.switch-language` with submit button `name="languageId"`
- **Redirect:** `data-form-add-dynamic-redirect="true"` (core FormAddDynamicRedirect)
- **Locale routes:** hidden `languageCode_{id}` when `_route_params._locale` is set
- **Active option:** CVA `active` variant + `aria-current="true"`
- **Display:** optional flag + optional code in `prepend`; name via Button `label`; `caret-down` in `append`
- **Flags:** [lipis/flag-icons](https://github.com/lipis/flag-icons) **4×3** SVGs under `src/Resources/public/flags/`, named as Shopware `translationCode` (e.g. `de.svg`, `en-US.svg`, `cs.svg`). MIT license in that folder. Rendered via `Language:Flag` (`data-component="ViewsTheme:Language:Flag"`): primary `src`, optional `fallbackSrc` (language segment, e.g. `en-US` → `en.svg`); on `error`, try fallback once then remove the img — no inline handlers. `:showFlag="false"` hides them. Add more locales by copying upstream 4×3 SVGs under the matching code name (`en.svg` uses GB artwork).
- **CSS:** co-located `Language/Action.css` + `Language/Menu.css` — consume tokens with fallbacks only (`var(--vi-flag-w, 14px)`, `var(--vi-flag-ar, 4 / 3)`, `var(--vi-min-w, 10rem)`, …). Theme may assign overrides in `app/storefront/src/css/components.css` (e.g. `--vi-max-w` on the action host for Dropdown). See [CSS custom properties](../conventions/css-classes.md#css-custom-properties-critical)

## Dropdown composition

Same patterns as [Account action](account-action.md):

- `class` → panel, `host:class` → host; toggle is a full `Button` owned by Action (hardcoded `sm` / `white`)
- Pre-bind parent `cx` slots / `buttonLabel` before Dropdown mount (nested name shadowing — Dropdown also has `color` / `label` / `buttonSize`)
- No `class` inside `attributes.defaults`
- Do **not** nest `{% block %}` inside `<twig:block>` to fill Button slots through Dropdown — Action owns the Button

## Wire-up

Desktop top-bar — `storefront/layout/header/header.html.twig` overrides block `layout_top_bar`:

```twig
<twig:ViewsTheme:Language:Action
    :languages="header.languages"
    placement="bottom-end"
/>
```

Optional stable `id="vi-header-language"`. Toggle is always `Button` `size="sm"` `color="white"`.

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
- [UX components](../conventions/ux-components.md)
