# Hard rules (checklist)

Agent-facing index of **must-follow** conventions. Rule text lives in the linked topic docs — do not duplicate it here.

**Maintenance:** change conventions only in the topic page. Add/remove a checklist row here only when a new topic or link is needed. Do not expand rule prose into `AGENTS.md`.

## Before coding

Open the relevant links below and follow them. Full index: [docs/README.md](../README.md).

## Checklist

| Topic | Doc |
|-------|-----|
| **Holistic refactors (critical):** prefer root-cause / shared-pattern fixes — no hacky quick fixes | [agent-workflow.md — Holistic refactors](agent-workflow.md#prefer-holistic-refactors-critical) |
| **No build steps (critical):** never run asset/theme/JS compile or watch | [agent-workflow.md — No build](agent-workflow.md#never-run-a-build-step-critical) |
| UX tags, **prop defaults** (no wasteful `resolved*`), **class components** for heavy view-model, CVA, attributes, BEM `vi-*`, scope (`components/` only) | [ux-components.md § Props](ux-components.md#props) · [class components](ux-components.md#class-components-php-backed) |
| Component template checklist | [components.md](components.md) |
| `vi_cva` / `vi_cva_from_file` | [vi-cva.md](../twig/vi-cva.md) |
| Icons (`vi_icon`) | [vi-icon.md](../twig/vi-icon.md) |
| JS: `data-component`, no CSS selectors, no `data-ref`, `ShopwareComponent` | [javascript.md](javascript.md) |
| JS bus: `emit` / `emitQueued` / `on` / `off`, `callMethod`, event PascalCase | [javascript.md](javascript.md) |
| **Lazy shells (critical):** never cache HTML/DOM; unmount on close; always (re)fetch on open (Search term via Open/Close payload only) | [javascript.md — Lazy-loaded shells](javascript.md#lazy-loaded-shells-critical) |
| Removed class-map APIs (`vi_define_classes`, `vi_attr_classes`, `vi_classes`) | [css-classes.md](css-classes.md) |
| **CSS vars (critical):** component CSS only `var(--token, fallback)` — never assign `--token` there; theme assigns overrides | [css-classes.md — CSS custom properties](css-classes.md#css-custom-properties-critical) |
| Storefront routes `/vi/…`, `path(…)` only, no new `/widgets/…` | [architecture.md](../architecture.md) |
| **XHR UX HTML (critical):** always `AbstractComponentController::renderComponent()` — never raw `createAndRender` Response | [architecture.md — UX XHR](../architecture.md#ux-xhr-component-responses-critical) |
| **XHR data hooks:** after core loader, fire matching App `*LoadedHook` when core defines one | [architecture.md — data + App hooks](../architecture.md#theme-xhr-controllers--data--app-hooks) |
| Design tokens (font, brand colors, grid) | [configuration.md](../configuration.md) |
| Plugin / theme config | [configuration.md](../configuration.md) |

## Related

- [Agent workflow](agent-workflow.md) — holistic refactors; no build steps
- [UX Twig components](ux-components.md)
- [JavaScript](javascript.md)
- [Architecture](../architecture.md)
- Root [AGENTS.md](../../AGENTS.md) — agent routing only
