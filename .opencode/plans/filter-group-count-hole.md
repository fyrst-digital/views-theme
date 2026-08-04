# Filter:Group:Count — Twig-owned format (drop JS parentheses)

## Problem

`Filter:Group.setCount` invents presentation:

```js
this._count.textContent = `(${count})`
```

SSR `Count.html.twig` renders a bare number; after hydrate JS wraps it. Format is not owned by the Count component.

## Goal

Twig owns chrome (`(…)`). JS only fills a **value hole** and toggles `hidden` — same spirit as `Filter:Active` templates / Cart badge (number only, no format strings in JS).

Batch `meta.count` stays a number (local `_syncCount` still needs it without a refetch). No `countHtml` in filter-options.

## Approach

### 1. `Count.html.twig` — structure + hole

```twig
<span data-component="ViewsTheme:Filter:Group:Count" hidden="…">
  (<span data-count-value>{% if count %}{{ count }}{% endif %}</span>)
</span>
```

- Parentheses are static markup (SSR and client identical).
- `data-count-value` is Count-contract structure (like `data-active-chip-label` on Active), not a generic `data-ref`.

### 2. `Count.js` — own `setCount`

```js
setCount(count) {
  const hole = this.el.querySelector('[data-count-value]')
  if (count) {
    this.el.hidden = false
    if (hole) hole.textContent = String(count)
    return
  }
  this.el.hidden = true
  if (hole) hole.textContent = ''
}
```

### 3. `Group.js` — delegate

`setCount(count)` resolves Count instance (`getComponentInstanceByElement`) and calls `count.setCount(count)`. No `textContent` / parentheses on Group.

Keep Group API so MultiSelect / Rating call sites stay `_group()?.setCount?.(…)`.

### 4. Docs

`docs/features/filters.md` — Count row: selection badge; Twig owns `(n)` chrome; value hole updated via Count `setCount` (Group delegates).

## Out of scope

- Returning Count HTML from `FilterOptionsPayloadBuilder` (overkill; numeric meta + local sync is enough).
- Changing badge styles / CVA.
- Builds (human verifies).

## Files

| File | Change |
|------|--------|
| `components/Filter/Group/Count.html.twig` | Parens + `data-count-value` hole |
| `components/Filter/Group/Count.js` | Implement `setCount` |
| `components/Filter/Group.js` | Delegate `setCount` to Count instance |
| `docs/features/filters.md` | Count ownership note |

## Verify (human)

1. Select a property option → toggle shows `(1)` immediately (no flash of bare `1`).
2. Soft reload with filters in URL → SSR already shows `(n)`.
3. Deselect all → badge hidden.
4. filter-options refetch after apply → count still correct.
