# Agent workflow (critical)

Must-follow rules for AI agents working on ViewsTheme. Human developers may still run builds and choose local shortcuts; agents must not.

## Prefer holistic refactors (critical)

When fixing or extending code, prefer a **holistic refactor** over a hacky or one-off quick fix.

| Do | Don't |
|----|--------|
| Fix the root cause and shared pattern | Local workaround that papers over the bug |
| Align with existing conventions and extend the system cleanly | Dual paths, special-case branches, or copy-paste variants |
| Touch the right layer (UX component, JS contract, route, token) | Patch only the call site when the abstraction is wrong |
| Leave one clear approach after the change | Leave legacy + new side by side “for now” |

If a proper fix is larger than a drive-by edit, still do the proper fix (or stop and plan it) — do not ship a brittle shortcut.

## Never run a build step (critical)

Agents must **never** run asset, theme, or JS compile/watch commands. The human rebuilds and verifies the storefront.

### Forbidden (non-exhaustive)

- `bin/console theme:compile` / `theme:refresh` (when used as a rebuild)
- `bin/build-storefront.sh`, `make build-storefront`, `bin/build-js.sh`
- `composer build:js:storefront` / any `composer build:*` storefront asset target
- `npm run build`, `npm run build:css`, `npm run watch`, `npm run watch:css` (and equivalents)
- Any other storefront/theme asset pipeline that compiles or watches CSS/JS

### Allowed CLI (examples)

- `bin/console cache:clear`
- `bin/console plugin:install` / `plugin:activate` / `plugin:update` / `plugin:refresh`
- Database migrations and other non-build Symfony console commands needed for the task

Build steps for humans are documented in [getting-started.md](../getting-started.md). Do not treat those sections as agent runbooks.

## Surgical edits only (critical)

Prefer **minimal, targeted patches**. Do **not** replace whole files when fixing a local issue.

| Do | Don't |
|----|--------|
| Read the file on disk immediately before editing | Edit from a stale mental snapshot of an earlier version |
| Use a targeted search/replace (smallest possible hunk) for local fixes | Full-file rewrite / overwrite for a few-line change |
| Preserve unrelated human (or prior) edits in the same file | “Recreate” the file and wipe concurrent tweaks (tokens, fallbacks, formatting) |
| Re-read after the user (or another turn) may have edited the file | Assume disk still matches what you last wrote |

**Full-file write is OK only** when creating a **new** file, or when the user **explicitly** asks to rewrite / replace the whole file.

Full-file overwrites are a common agent failure mode: a small rule fix clobbers intentional human changes that landed between turns.

## Related

- [Hard rules checklist](hard-rules.md)
- [Getting started](../getting-started.md) — human install and asset build
