# Cross-component nest chrome audit & cleanup

## Goal

Apply the **Buy-proven pattern** across UX components:

1. **No parallel chrome props** when nest `X` exists — chrome only in `attrs.X.defaults({…})`; external API = `X:prop` / `:X:prop`.
2. **Root HTML bags** — `attributes.defaults({ action: path(…) })`, not pass-through `formAction`.
3. **VM / props** — domain + non-trivial derived only; simple entity fields inline in nest defaults.
4. **Docs** — examples and feature pages match; no `buyLabel` / `buttonSize` / `toggleLabel`-as-chrome leftovers where nests apply.

Reference (already clean): `Product:Action:Buy`, `Account:Login` field nests, `Cart:PromotionForm`, `Cart:Actions` / `Options`.

Convention SoT: [docs/conventions/ux-components.md](../../docs/conventions/ux-components.md) § No parallel chrome props.

---

## Out of scope (exceptions — document, do not force)

| Case | Examples | Why OK |
|------|----------|--------|
| **Root-host leaf** | `Wishlist:Action`, `Search:Action`, `Cart:Drawer:Action`, `Product:Action:Detail`, `Cart:Action:*` | Child *is* root via `attributes.defaults`; own props **are** the leaf API |
| **DOM nests + content props** | `Drawer`/`Panel`/`Header` `title`, `Form:Input`/`Button`/`QuantityInput` leaf controls | Own DOM / control API, not parallel child chrome |
| **Loop data** | `VariantsGrid:Column:Quantity` `:variant=…` | Per-item hardcode allowed |
| **Form:Input:Group facade** | Flat `type`/`placeholder`/`size` + nest `input` | **Intentional dual API** for PromotionForm DX (`field:placeholder` not `field:input:placeholder`). **Document as exception** — do not migrate unless product asks |

---

## Phase 1 — Dropdown cascade (highest blast radius)

### Code

| File | Change |
|------|--------|
| `Dropdown.html.twig` | Drop props `color`, `buttonSize`, `icon`, `label`. Defaults only in `attrs.toggle.defaults({ type, color: 'none', size: 'md', icon: null, label: null, popovertarget, aria-* })`. Keep domain: `id`, `placement`, `cva`. |
| `Account/Action.html.twig` | Drop `buttonSize`, `color`, `label`. Single spread: `'toggle:icon': 'user'`, `'toggle:label': …`, `'toggle:color': 'none'`, `'toggle:size': 'md'`, a11y keys. No hardcoded `:color` / `:buttonSize` / `:label`. |
| `Page/Header/Actions.html.twig` | `:label="false"` on Account → `:toggle:label="false"` (or `toggle:label` false via nest). Wishlist stays `:label="false"` (root-host). |

### Call-site grep after

- `buttonSize`, Dropdown `:color=`, `:label=` into Dropdown/Account
- Navigation drawer header if it passes Account label

### Docs

- `docs/conventions/javascript.md` § Dropdown — remove `color`/`buttonSize` prop blurb; document `toggle:*`
- `docs/features/account-action.md` — nest-only toggle chrome; header `:toggle:label="false"`
- `docs/features/navigation-drawer.md` — Account label wording
- `ux-components.md` — Dropdown as pilot for nest-only chrome (if needed)

---

## Phase 2 — Missing Button nests

| File | Change |
|------|--------|
| `Account/Login/Actions.html.twig` | Drop `submitLabel`, `recoverLabel` (keep `recoverUrl` as domain **or** inline `seoUrl` in defaults). Nests `login` + `recovery`; chrome in `attrs.*.defaults`. |
| `Account/Menu.html.twig` | Register `Button`: nest `register` + defaults (type/color/href/label); drop hardcoded `:label`. |

Docs: `account-action.md` Login:Actions nests.

---

## Phase 3 — LineItem + form root action (Buy parity)

| File | Change |
|------|--------|
| `LineItem/Remove.html.twig` | Drop `formAction`; `action: path('frontend.checkout.line-item.delete', { id: lineItem.id })` in root defaults. Keep `label` only if used for aria (domain) — prefer inline `lineItem.label\|trans` in `aria-label` default and drop prop if unused elsewhere. |
| `LineItem/Quantity.html.twig` | Drop `formAction`; inline path. Add `quantityInput` nest; QuantityInput via `attrs.quantityInput.defaults({ quantity: lineItem.quantity, min/max/steps, size: 'sm', disabled: isDigital })`. Keep domain: `lineItem`, gates, redirects. Heavy digital gate stays Twig (or class later — optional). |
| `VariantsGrid/Container.html.twig` | Prefer `attributes.defaults({ action: path(…) })` over bare `action="{{ formAction }}"` local. |

Docs: cart-drawer / line-item notes if any formAction API.

---

## Phase 4 — Language / Currency `toggleLabel`

These **override** Dropdown `toggle` block with a rich Button (flag/symbol). Dropdown nest defaults do not apply inside the override.

| File | Change |
|------|--------|
| `Language/Action.{php,html.twig}` | Drop public `toggleLabel`. Own nest or pre-bound Button defaults inside toggle block: `attrs.toggle` on **Action** (not Dropdown) for the owned Button; default `label: ariaName`; caller `:toggle:label="false"`. Domain stays: languages, flags, placement, visible, … |
| `Currency/Action.{php,html.twig}` | Same |

**Shadowing note:** Today `toggleLabel` exists because Dropdown declares `label`. After Phase 1 Dropdown drops `label`, parent `label` is freer — but nest `toggle:label` is still the preferred external API for consistency with Account/Dropdown.

Docs: `language-switch.md`, `currency-switch.md` — replace `toggleLabel` with `toggle:label`; update composition section (remove “named to avoid shadowing” if obsolete).

---

## Phase 5 — Shared `size` pass-through

| File | Change |
|------|--------|
| `Cart/ShippingCalculation.html.twig` | Drop `size` prop; hardcode `size: 'sm'` (or omit) inside `summary` / `selection` nest defaults. |
| `Cart/ShippingCalculation/Selection.html.twig` | Same for country/payment/shipping nests. |

Callers using `:size` on these → `summary:size` / nested keys (grep first).

---

## Phase 6 — Optional / mild (only if time)

| Item | Notes |
|------|--------|
| `Product/Actions` + `Box/Actions` `href` | Prefer inline `seoUrl` / builder in `attrs.detail.defaults`; override via `detail:href`. Box:Actions PHP may still derive href for VM — OK if not duplicated as chrome. |
| `Account/LoginCard` | Optional nest `login` instead of long hardcoded `:prop` list |
| `Cart/Drawer/Footer` | Optional nests for summary/options/actions |
| Root-host leaves chrome props | No change |

---

## Docs / convention pass (with each phase)

| Doc | Touch |
|-----|--------|
| `ux-components.md` | Already has rule; add **Form:Input:Group facade exception** row; mark Dropdown/Login:Actions/LineItem as aligned after phases |
| `hard-rules.md` | No new row (existing UX link) |
| Feature pages | Per phase above |
| `javascript.md` Dropdown | Phase 1 |

---

## Implementation order & risk

```
P1 Dropdown → Account:Action → Header Actions → docs     [high risk, header]
P2 Login:Actions → Menu register                          [medium]
P3 LineItem Remove/Quantity → VariantsGrid form           [medium, cart]
P4 Language/Currency Action                               [medium, header/drawer]
P5 ShippingCalculation size                               [low]
P6 optional                                               [low]
```

**Verify per phase:** grep removed props; spot-check header (account/lang/currency), cart drawer qty/remove, login form. **No build step.**

---

## Success criteria

- No component both declares nest `X` **and** public props that only feed `attrs.X.defaults` chrome (except documented Group facade).
- No `formAction` prop used solely as root `action`.
- Docs examples use `toggle:label` / `button:label` / `quantityInput:*`, not parallel props.
- Buy remains the reference leaf; Dropdown + Account become the reference host cascade.

---

## Explicit non-goals

- Migrating `Form:Input:Group` off dual control props
- Converting all root-host leaves to nest-only zero-prop shells
- Class-backing every anonymous template with heavy Twig (LineItem:Quantity digital gate optional later)
