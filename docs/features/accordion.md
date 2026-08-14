# Accordion

Generic accessible accordion primitive. Domain shells (e.g. PDP Description/Reviews) compose it — they do **not** own accordion a11y or keyboard behaviour.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Accordion` | Owner JS: click + Arrow/Home/End, `toggle` / `open` / `close`, `ViewsTheme:Accordion:Change` — ARIA only, no class toggles |
| `Accordion:Item` | Header + panel pair identity host |
| `Accordion:Header` | Button + `aria-expanded` + `aria-controls` → panel id; look via `Header.css` + `[aria-expanded]` |
| `Accordion:Panel` | `role="region"` + `aria-labelledby` → header id; `hidden` when collapsed |

## Composition

```
Accordion (data-component owner)
└─ Accordion:Item × N
     ├─ Accordion:Header
     └─ Accordion:Panel
```

```twig
<twig:ViewsTheme:Accordion active="header-a" :multiple="false" :collapsible="false">
    <twig:block name="items">
        <twig:ViewsTheme:Accordion:Item>
            <twig:block name="header">
                <twig:ViewsTheme:Accordion:Header
                    id="header-a"
                    panel="pane-a"
                    :active="true"
                >
                    <twig:block name="content">A</twig:block>
                </twig:ViewsTheme:Accordion:Header>
            </twig:block>
            <twig:block name="panel">
                <twig:ViewsTheme:Accordion:Panel id="pane-a" header="header-a" :active="true">
                    <twig:block name="content">…</twig:block>
                </twig:ViewsTheme:Accordion:Panel>
            </twig:block>
        </twig:ViewsTheme:Accordion:Item>
    </twig:block>
</twig:ViewsTheme:Accordion>
```

## Props

| Component | Prop | Role |
|-----------|------|------|
| `Accordion` | `active` | Initial open **header id** (SSR + JS hydrate) |
| `Accordion` | `multiple` | Allow several open (`false` = exclusive) |
| `Accordion` | `collapsible` | Allow closing the last open item |
| `Accordion:Header` | `id`, `panel`, `active` | Header id, target panel id, SSR expanded |
| `Accordion:Panel` | `id`, `header`, `active` | Panel id, labelling header id, SSR visible |

## JS API

| API | Role |
|-----|------|
| `toggle(headerId, { focus, emit })` | Open if collapsed, close if expanded (respects `collapsible`) |
| `open(headerId, { focus, emit })` | Expand; exclusive mode closes others |
| `close(headerId, { focus, emit })` | Collapse; no-op when `collapsible=false` and it is the last open item |
| `ViewsTheme:Accordion:Change` | `{ el, itemId, panelId, expanded }` after user (or emitting) change |

Discovery uses `[data-component="ViewsTheme:Accordion:Header|Panel"]` — never CSS classes.

### Active state

| Concern | SoT |
|---------|-----|
| Expanded header | `aria-expanded` — set SSR from `active` prop; JS updates on change |
| Visible panel | `hidden` on `Accordion:Panel` |
| Visual expanded/collapsed | `Accordion/Header.css` keyed off `[aria-expanded='true']` — **not** CVA variants or JS `classList` |

CVA on Header is chrome only (`base`). Runtime look cannot use CVA variants (Twig-time only).

## Consumers

| Shell | Doc |
|-------|-----|
| `Cms:DescriptionReviews` (`appearance=accordion`) | [review.md](review.md) |

## Related

- [Tabs](tabs.md) — tablist alternative used by the same CMS shell
- [JavaScript](../conventions/javascript.md)
