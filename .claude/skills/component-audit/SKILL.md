---
name: component-audit
description: Audit ViewsTheme UX components for dead, duplicated or overlapping usage (recurring issue #64), plan the cleanup, and implement approved steps as one PR each. Use when asked to review component redundancy, find unused components, consolidate near-identical components into generic ones, or continue the #64 plan.
---

# Component audit (issue #64)

Recurring task: keep the component set under `src/Resources/views/components/` minimal, with generic components reused instead of near-copies. Issue: https://github.com/fyrst-digital/views-theme/issues/64 (repo `fyrst-digital/views-theme`).

**Phases are gated.** Audit and plan first, post them, and wait for the user's decision before touching code. Never continue to the next plan step on your own; implement only what the user approved.

Read before starting: [hard-rules.md](../../../docs/conventions/hard-rules.md), [agent-workflow.md](../../../docs/conventions/agent-workflow.md) (no builds, surgical edits, holistic refactors), [ux-components.md](../../../docs/conventions/ux-components.md) (incl. "Skip the mount instead of self-gating"), [components.md](../../../docs/conventions/components.md). Read the previous audit and progress comments on #64 first (`gh issue view 64 --repo fyrst-digital/views-theme --comments`) so you only report what is new and do not re-propose items the user already decided against.

## 1. Audit (read-only)

Scope: every component under `src/Resources/views/components/` (name `ViewsTheme:Foo:Bar` is `Foo/Bar.html.twig`, plus optional `.cva.twig`, `.css`, `.js`, class-backed `.php`).

### Dead components

A component is only a dead candidate when **no** reference of any kind exists. Grep all forms, in `src/` (twig, php, js, scss) and `docs/`:

- `<twig:ViewsTheme:Foo:Bar` and `{% component 'ViewsTheme:Foo:Bar' %}`
- string names in PHP (`renderComponent('ViewsTheme:Foo:Bar', …)`, controllers, class components, `LineItem` type maps)
- `data-component` / `Shopware.emit/on/callMethod` names in JS
- `{% extends %}` / `{% include %}` of the template path, and `{% deprecated %}` core-extends shells

Treat "documented as deprecated shim" and "documented as not mounted yet" as separate groups: the first is safe to propose, the second needs the user's decision. Anything mounted via a computed string name can look dead when it is not, so verify each one individually.

### Duplication

Look for:

- identical or near-identical files differing only in a name, event or label (e.g. several Close buttons, count badges)
- thin presets: 5-10 line components that only set props on another component and are mounted from one place
- alias components that just forward to another (`extends`/single child mount)
- groups of sibling wrappers with the same options logic (e.g. three `Form:Select` wrappers)
- parallel menu/toggle pairs with the same structure
- heading/title variants next to a generic `Page:Title`

### Keep (do not propose merging)

- components that carry their own `data-component` and JS even if the markup looks alike
- siblings with different jobs (`Filter:Chip` vs `Filter:Active:Chip`)
- layouts that differ in markup and escaping (`Cart:Summary:Item` dl vs `Order:SummaryItem` div): merging only moves wiring
- components whose styling lives in another component's CSS; list them as follow-ups instead

### Report format

Group findings as **A. Probably dead** (with evidence), **B. Real duplication** (table: duplicated, evidence, proposed generic), **C. Looks redundant, keep** (with reason). End with a **plan**: one PR per step, lowest risk first (dead removal, aliases/inlining, generic replacements, larger merges). For each proposed generic component say whether a new component is worth it. Post the audit as a comment on #64 only when the user says so.

## 2. Implement approved steps

One branch and one PR per step, branched from `master` (`refactor/<short-name>`).

1. Make the change. Surgical edits; new files only for the generic component. Follow the component checklist (props with defaults, CVA via `vi_define_cva`/`vi_class`, attrs via `vi_define_attrs`/`vi_attrs`, BEM `vi-*`, px-only CSS, `data-component` JS with `ShopwareComponent`). When replacing, move the styling into the caller's CVA slots rather than keeping legacy and new side by side.
2. Delete the replaced files (twig, cva, css, js, php) and update every call site. Re-grep the removed names across `src/` and `docs/` to confirm no reference is left.
3. If a call site only needs the component conditionally, gate the `<twig:…>` tag there instead of wrapping the whole component template in `{% if %}`.
4. Update the matching `docs/` pages (conventions and `docs/features/*`), including any component list mentioning the removed names.
5. Never run asset/theme/JS builds. Check Twig with the repo's lint (`lint:twig`; a `sw_csrf` unknown-function error on `Newsletter/Form.html.twig` is a known linter limitation) and render checks via the Shopware kernel where the UI cannot reach a state.
6. Commit with a conventional message (`refactor(<area>): …`) ending with the `Co-Authored-By` line from the session attribution reminder. Commit only when asked, or when the step explicitly includes the PR.

## 3. Verify in the browser

Use the Chrome DevTools MCP against `http://localhost:8000` (Vite dev server runs separately; restart it in the web container after editing existing `@views-theme/modules` files). Smoke-test every page that mounts the changed components, including closing/unmounting overlays, JS events, and the console for new errors. Compare suspicious console errors against `master` before attributing them to the change. Revert any shop data you change for testing. Test account credentials come from the user; do not write them into files.

## 4. PR and issue bookkeeping

- PR against `master`; body: summary, what was removed/replaced, call-site changes, a **Test plan** checklist of what you ticked in the browser (leave untestable items unticked and say why). Use `Refs #64`, not `Closes #64`, unless the user says the issue is finished. End the body with the attribution line from the session reminder.
- After `gh pr create`, call the T3 `link_pull_request` tool for each PR.
- Post a progress comment on #64 only when the user agrees: a table (step, PR, what) plus findings (items intentionally not done and why, follow-ups discovered, bugs fixed on the way).
- If the user asks to combine step PRs: create the combined branch from `master`, merge the step branches, open one PR, then close the step PRs referencing it.

## Open items carried over

Update this list when a run finishes: plan items 6 (`Shipping:Selection` / `Payment:Selection`), 8 (`Currency:*` / `Language:*` switch pair) and 9 (heading variants into `Page:Title`); `Gallery:Fullscreen:Close` is a fourth close button styled by `Gallery/Control.css`.
