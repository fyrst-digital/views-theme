# Plan: Product:Action:Detail → class component + rule fixes

## Goal

Make `Product:Action:Detail` a PHP class-backed UX component (like `Product:Action:Buy` / `Product:Cover`), fix the props anti-pattern, listing-aware `href` fallback, docs, and small parent cleanup.

## Context (review summary)

| Item | Action |
|------|--------|
| Wasteful `{% set detailHref %}` | Remove — derive in `Detail.php` |
| Bare `seoUrl` fallback | Use `ProductDetailUrlBuilder` in `PostMount` |
| Root-host → `Button` | Keep (allowed exception) |
| `btn-detail` | Keep — core SpeculationRules selector |
| Empty href | Gate render with `visible` |
| Docs | Full Detail section in `product-box.md` |

## Target shape

### `Detail.php` (new)

Path: `src/Resources/views/components/Product/Action/Detail.php`  
Namespace: `Fyrst\ViewsTheme\Resources\views\components\Product\Action`  
Registration: existing `services.xml` prototype (`**/*.php` + autowire/autoconfigure) — **no** services.xml edit.

**Public API (domain / VM only — no chrome props):**

| Prop | Default | Notes |
|------|---------|--------|
| `product` | `null` | `SalesChannelProductEntity` when set |
| `href` | `null` | Explicit URL wins |
| `referrerCategoryId` | `null` | Builder args (same as Cover/Header/Footer) |
| `searchTerm` | `null` | Builder args |
| `cva` | `[]` | |
| `visible` | derived | `href !== null && href !== ''` after PostMount |

**Constructor:** inject `ProductDetailUrlBuilder` only.

**`#[PostMount]`:**

```php
if ($this->href !== null && $this->href !== '') {
    $this->visible = true;
    return;
}

if ($this->product instanceof SalesChannelProductEntity) {
    $this->href = $this->productDetailUrlBuilder->forProduct(
        $this->product,
        $this->referrerCategoryId,
        $this->searchTerm,
    );
}

$this->visible = $this->href !== null && $this->href !== '';
```

Mirror Cover/Header: `$this->href ??= …` so caller `href` wins.

**Do not** put `label` / `title` / `color` on the class. Chrome stays only in Twig `attributes.defaults` (same idea as Buy nest defaults). Callers still override with `detail:label`, `detail:color`, … — those land on the attributes bag and win over `.defaults`.

### `Detail.html.twig` (rewrite)

- **No** `{% props %}` (class-backed rule).
- Composition only: CVA + root-host Button.
- Gate: `{% if visible %}`.

```twig
{% if visible %}
    {% set cx = vi_cva_from_file(cva) %}

    {% block content %}
        <twig:ViewsTheme:Button
            class="{{ cx.root.apply() }}"
            {{ ...attributes.defaults({
                type: 'link',
                href: href,
                label: 'listing.boxProductDetails'|trans|sw_sanitize,
                title: null,
                color: 'light',
            }).all() }}
        />
    {% endblock %}
{% endif %}
```

Notes:

- `title: null` → Button’s own `title ?? label` still applies after mount.
- Translated label stays in Twig (no Translator in component PHP — project pattern).
- `class` stays on the tag, never inside `.defaults`.

### `Detail.cva.twig` (unchanged content)

```twig
{ root: { base: 'vi-product-action-detail btn-detail' } }
```

Document why `btn-detail` remains (core `speculation-rules.plugin.js` → `selectorProducts`).

## Call sites

### `Product:Box:Actions.html.twig`

Keep current nest; still pass `product` + `href` (Footer already built listing URL — no double work required, `href ??=` in Detail is no-op when set).

No change required unless we want to drop redundant `href` later (out of scope).

### `Product:Actions.html.twig`

Remove bare `seoUrl` / `detailHref` local. Pass domain into Detail:

```twig
{{ ...attrs.detail.defaults({
    product: product,
    href: href,
}).all() }}
```

(`href` prop on Actions stays optional override; Detail builds when null.)

Leave Actions’ buy/detail **gate** Twig VM as-is (separate class-component pass if desired).

## Docs

### `docs/features/product-box.md`

1. Ownership row: `Product:Action:Detail` → class-backed.
2. New **Props** subsection for Detail (table above + chrome via attributes / root-host).
3. Behaviour:
   - Root-host `Button` (`type=link`, default `color=light`, label `listing.boxProductDetails`)
   - Overrides: `detail:label`, `detail:color`, … (not `detail:button:*`)
   - `href` via builder when null + `product`; optional `referrerCategoryId` / `searchTerm`
   - `btn-detail` kept for SpeculationRules
4. Composition / Files: include `Action/Detail.{php,html.twig,cva.twig}`
5. Adjust Detail URL ownership note: builder also used as Detail fallback; primary listing owners remain Cover / Header / Footer.

### `docs/conventions/ux-components.md`

- Pilots list: add `Product:Action:Detail`.
- Migration status Product row: mention Detail class-backed.

## Out of scope

- Converting Detail to nest-`button` (Buy-style) — optional later; root-host stays.
- Class-backing `Product:Actions` buy gate.
- Dropping `btn-detail` or adding co-located Detail CSS.
- Build / theme compile ([agent-workflow](../../docs/conventions/agent-workflow.md)).

## Verification

- `php -l` on `Detail.php`
- Grep: no `detailHref` in Detail; no `{% props %}` in Detail.html.twig
- Grep: `Product:Actions` no longer calls `seoUrl` for detail
- Manual: listing non-buyable product → details link; optional `detail:color` override still works
- No asset build

## File checklist

| Path | Change |
|------|--------|
| `components/Product/Action/Detail.php` | **Create** |
| `components/Product/Action/Detail.html.twig` | Rewrite (class composition) |
| `components/Product/Action/Detail.cva.twig` | Keep |
| `components/Product/Actions.html.twig` | Pass `product`+`href`; drop `detailHref` |
| `docs/features/product-box.md` | Detail API + behaviour |
| `docs/conventions/ux-components.md` | Pilots + migration blurb |
