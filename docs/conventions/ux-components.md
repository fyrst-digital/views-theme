# UX Twig components

ViewsTheme storefront UI uses **Shopware UX Twig components** (Symfony UX TwigComponent, Shopware ≥ 6.7.11).

Namespace: **`ViewsTheme`** (plugin bundle name).

```twig
<twig:ViewsTheme:Alert type="info" content="Hello" />
<twig:ViewsTheme:QuantityInput quantity="1" size="sm" />
```

## Directory layout

Anonymous components under `src/Resources/views/components/`:

```text
Alert/index.html.twig                 → ViewsTheme:Alert
QuantityInput/index.html.twig         → ViewsTheme:QuantityInput
Header/Main/index.html.twig           → ViewsTheme:Header:Main
Header/Action/Cart/
  index.html.twig
  index.js                            # optional co-located JS
```

- PascalCase directories / names.
- Prefer `index.html.twig` so the directory name is the component name.
- Co-located `index.js` / `index.scss` when the component needs its own assets.

## Props

Declare every input with `{% props %}` and defaults where possible:

```twig
{% props
    type = 'info',
    dismissible = false,
    defaultBaseClasses = 'vi-alert alert d-flex …',
    defaultVariants = {
        variants: {
            type: {
                danger: 'alert-danger',
                info: 'alert-info',
            },
        },
    },
%}
```

Do not rely on parent scope variables unless passed as props (or intentional globals such as `themeParameters` with a default).

## Classes: CVA + attributes

Use `cva()` and the UX `attributes` bag. Do **not** use `vi_define_classes` on new components.

```twig
{% set rootCVA = cva(defaultVariants|merge({ base: defaultBaseClasses })) %}
{% set rootClass = attributes.render('class') %}
{% set iconAttributes = attributes.nested('icon') %}

<div
    {{ attributes.defaults({ role: 'alert' }) }}
    class="{{ rootCVA.apply({ type: type }, rootClass) }}"
>
    <div {{ iconAttributes.defaults({ class: 'vi-alert__icon …' }) }}>…</div>
</div>
```

Always call `attributes.render('class')` **before** rendering `attributes` / `attributes.defaults()`, so `class` is not output twice.

| Goal | How |
|------|-----|
| Extra root classes | `class="mt-3"` on the tag |
| Nested element classes | `icon:class="text-primary"` → `attributes.nested('icon')` |
| Variant styles | CVA `variants` + props (`type`, `size`, …) |
| Stable theme hooks | BEM root with **`vi-`** prefix (`vi-alert`, `vi-quantity-input`) |

Theme SCSS stays under `app/storefront/src/scss/` for now; target `vi-*` roots when needed.

## Blocks

- Short names only (`content`, `icon`, `media`) — no `component_*` prefix.
- Element-like components expose `{% block content %}` for default slot body.

## JavaScript

Interactive roots use the **full UX tag name**:

```html
data-component="ViewsTheme:QuantityInput"
data-component-options="{{ jsOptions|json_encode }}"
```

Co-located `index.js` extends global `ShopwareComponent` and is loaded via the Storefront import map (Vite component build).

**Internal hooks** (not separate UX components) use **`data-ref`**, never bare kebab `data-component` values:

```html
<tbody data-ref="grid-body"></tbody>
```

See [JavaScript](javascript.md).

## Migration status

| Area | Status |
|------|--------|
| `ViewsTheme:Alert` | UX |
| `ViewsTheme:QuantityInput` | UX |
| `ViewsTheme:Header:*` (Main, Logo, Actions, Search, Action/*) | UX |
| `ViewsTheme:Header:Action:Cart` | UX + co-located `index.js` |
| `ViewsTheme:Search:*` (Bar, Suggest, SuggestItem, SuggestEmpty, SuggestSummary) | UX |
| `ViewsTheme:Search:Pagelet` | Component (still `sw_extends` core pagelet; not a storefront override) |
| `ViewsTheme:Offcanvas` | UX |
| `ViewsTheme:LanguageSwitch` | UX (invoke via `<twig:ViewsTheme:LanguageSwitch />`) |
| `ViewsTheme:Navigation:Flyout` | Component (still `extends` core flyout + `parent()`; not a storefront override) |
| `ViewsTheme:Product:*` (Name, Price, Cover, Badges, Box, Action/*, Header, …) | UX |
| `Product:Listing`, `Product:BuyContainer` | Component (`sw_extends` core listing/buy-widget; compose UX children) |
| `ViewsTheme:LineItem:*` | UX (router `LineItem` + Product/Promotion/Element/*) |
| `ViewsTheme:Cart:*` | UX (Summary, SummaryItem, Heading, forms, Drawer/Header, …) |
| `Cart:Widget`, `Wishlist:Widget` | Component (`extends` core header widgets under components/) |
| `Wishlist:Listing` | Component (extends Product Listing) |
| `ViewsTheme:Account:*` | UX (Dropdown, LoginForm, UserActions, PersonalCard) + LoginCard/Register extends |
| `ViewsTheme:Address:*` | Component (Form/Personal/Item/* still `sw_extends` core) |
| `ViewsTheme:Checkout:*` | UX (ConfirmTos, UserComment, DeliveryDateSelection + co-located JS) |
| `ViewsTheme:Order:*` | UX SummaryItem + Item/ItemDetails extends core |
| Other components under `views/components/` | Legacy `sw_include` + `vi_define_classes` (migrating by domain) |

Legacy class API: [CSS class API](css-classes.md) (deprecated for new work).

## Scope rules

- Migrate and create UI under **`src/Resources/views/components/` only**.
- **Do not create** new files under `src/Resources/views/storefront/`.
- **Only edit** existing storefront templates when replacing an include that already lives there (e.g. `layout/header/header.html.twig` → `<twig:ViewsTheme:Header:Main />`).

## Related

- [Component templates](components.md)
- [JavaScript](javascript.md)
- Shopware core README: `vendor/shopware/storefront/Resources/views/components/README.md`
