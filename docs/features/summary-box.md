# Summary box

`Summary:Box` is the shared card shell for summary-like asides: white surface, border, 12px radius, a coral accent bar, and a padded column body. It is shell only. It holds no content, JS, or `data-component`.

First consumer: [`Checkout:Summary`](checkout-confirm.md) (confirm page).

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Summary:Box` | Chrome only: root, accent bar, body column. Anonymous UX, no PHP, no JS |
| Consumer (e.g. `Checkout:Summary`) | Content in the `content` block, plus layout such as `position-xl-sticky` |

Sticky or other placement is **not** part of the shell. The consumer adds it through its own root CVA.

## Composition

```
Summary:Box (div.vi-summary-box)
├─ accent  (div.vi-summary-box__accent)
└─ body    (div.vi-summary-box__body)
   └─ content block
```

```twig
<twig:ViewsTheme:Summary:Box class="{{ vi_class('root') }}" {{ ...attributes.all() }}>
    <twig:block name="content">
        …
    </twig:block>
</twig:ViewsTheme:Summary:Box>
```

## Blocks and nests

| Block | Purpose |
|-------|---------|
| `accent` | The accent bar. Override or empty it to hide |
| `body` | The padded column wrapping `content` |
| `content` | Caller content (empty by default) |

Nests: `accent`, `body` (`accent:class`, `body:class`, …).

## CVA

| Slot | Base |
|------|------|
| `root` | `vi-summary-box d-flex flex-column overflow-hidden bg-white border rounded-4` |
| `accent` | `vi-summary-box__accent bg-primary w-100 flex-shrink-0` |
| `body` | `vi-summary-box__body d-flex flex-column gap-5 p-6` |

## CSS

`Box.css` only sets the accent height: `block-size: var(--vi-summary-box-accent, 4px)`.

## Related

- [Checkout confirm](checkout-confirm.md)
- [UX components](../conventions/ux-components.md)
