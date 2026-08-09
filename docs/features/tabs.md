# Tabs

Generic accessible tabs primitive. Domain shells (e.g. PDP Description/Reviews) compose it — they do **not** own tab a11y or keyboard behaviour.

## Ownership

| Piece | Responsibility |
|-------|----------------|
| `Tabs` | Owner JS: click + Arrow/Home/End, `select(tabId)`, `ViewsTheme:Tabs:Change` — ARIA only, no class toggles |
| `Tabs:List` | `role="tablist"` identity host |
| `Tabs:Tab` | `role="tab"` + `aria-controls` → panel id; look via `Tab.css` + `[aria-selected]` |
| `Tabs:Panel` | `role="tabpanel"` + `aria-labelledby` → tab id; `hidden` when inactive |

## Composition

```
Tabs (data-component owner)
├─ Tabs:List
│    └─ Tabs:Tab × N
└─ panels region
     └─ Tabs:Panel × N
```

```twig
<twig:ViewsTheme:Tabs active="{{ activeTabId }}">
    <twig:block name="list">
        <twig:ViewsTheme:Tabs:List>
            <twig:block name="content">
                <twig:ViewsTheme:Tabs:Tab
                    id="tab-a"
                    panel="pane-a"
                    :active="true"
                >
                    <twig:block name="content">A</twig:block>
                </twig:ViewsTheme:Tabs:Tab>
                <twig:ViewsTheme:Tabs:Tab
                    id="tab-b"
                    panel="pane-b"
                    :active="false"
                >
                    <twig:block name="content">B</twig:block>
                </twig:ViewsTheme:Tabs:Tab>
            </twig:block>
        </twig:ViewsTheme:Tabs:List>
    </twig:block>

    <twig:block name="panels">
        <twig:ViewsTheme:Tabs:Panel id="pane-a" tab="tab-a" :active="true">
            <twig:block name="content">…</twig:block>
        </twig:ViewsTheme:Tabs:Panel>
        <twig:ViewsTheme:Tabs:Panel id="pane-b" tab="tab-b" :active="false">
            <twig:block name="content">…</twig:block>
        </twig:ViewsTheme:Tabs:Panel>
    </twig:block>
</twig:ViewsTheme:Tabs>
```

## Props

| Component | Prop | Role |
|-----------|------|------|
| `Tabs` | `active` | Initial / controlled tab **id** (SSR + JS hydrate) |
| `Tabs` | `label` | Optional `aria-label` on the list (via default `Tabs:List`) |
| `Tabs:Tab` | `id`, `panel`, `active` | Tab id, target panel id, SSR selected |
| `Tabs:Panel` | `id`, `tab`, `active` | Panel id, labelling tab id, SSR visible |

## JS API

| API | Role |
|-----|------|
| `select(tabId, { focus, emit })` | Activate tab; `callMethod('ViewsTheme:Tabs', 'select', id)` |
| `ViewsTheme:Tabs:Change` | `{ el, tabId, panelId }` after user (or emitting) change |

Discovery uses `[data-component="ViewsTheme:Tabs:Tab|Panel"]` — never CSS classes.

### Active state

| Concern | SoT |
|---------|-----|
| Selected tab | `aria-selected` (+ `tabindex`) — set SSR from `active` prop; JS updates on change |
| Visible panel | `hidden` on `Tabs:Panel` |
| Visual active/inactive | `Tabs/Tab.css` keyed off `[aria-selected='true'|'false']` — **not** CVA variants or JS `classList` |

CVA on Tab is chrome only (`base`). Runtime look cannot use CVA variants (Twig-time only).

## Consumers

| Shell | Doc |
|-------|-----|
| `Cms:DescriptionReviews` | [review.md](review.md) |

## Related

- [Drawer](cart-drawer.md) — same primitive + domain-shell pattern
- [JavaScript](../conventions/javascript.md)
