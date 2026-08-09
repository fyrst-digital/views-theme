---
description: Implement a goal end-to-end (conventions, code, docs, verify)
agent: build
---

# Implement

## Goal

$ARGUMENTS

Resolve the goal in this order:

1. **Non-empty `$ARGUMENTS`** — that text is the goal (may refine or override; e.g. “per plan above, also check mobile”).
2. **Empty `$ARGUMENTS`** — the goal is the **refined implementation plan already agreed in this session** (conversation Plan-mode output and any plan file path already discussed). Treat that plan as source of truth and implement it fully.
3. **No plan in context and no args** (new session, never planned) — ask one clarifying question and stop. Do not invent a large scope.
4. **Plan present but ambiguous or conflicting** — ask one clarifying question and stop. Do not guess.

## Repo snapshot

Status:
!`git status -sb`

Diff stat:
!`git diff --stat HEAD`

## Required conventions

Before coding, open and follow:

- @docs/conventions/hard-rules.md
- @docs/conventions/agent-workflow.md
- @AGENTS.md

When the goal touches a named feature, also open the matching page under `docs/features/`.

## Rules for this run

- Implement the goal fully in this turn: explore → edit → docs → verify.
- Surgical edits; prefer holistic refactors over hacky dual paths.
- Never run asset/theme/JS build or watch commands (`theme:compile`, `npm run build*`, `watch*`, storefront build scripts, etc.).
- Do not commit unless the goal explicitly asks to commit.
- You may write code directly as `build`; do not block on subagent “ask first” rules for this command.
- Never print secrets (passwords, tokens, full `.env` dumps) in the reply or tool output you summarize.

## Auth (only when verification needs it)

Credentials live in the **ViewsTheme plugin** `.env` (this project root), not Shopware root:

| Variable | Use |
|----------|-----|
| `USER_ACCOUNT_NAME` | Storefront customer login |
| `USER_ACCOUNT_PASSWORT` | Storefront password (exact spelling) |
| `ADMIN_ACCOUNT_USER` | Admin UI / admin API |
| `ADMIN_ACCOUNT_PASSWORD` | Admin UI / admin API |

Storefront base URL: Shopware project `APP_URL` (typically `http://localhost:8000`). Resolve with shell if needed (Shopware root `.env`), do not hardcode secrets.

Load plugin env in shell without echoing values, e.g. `set -a && . ./.env && set +a`.

## Verification (after implementation)

Classify the goal, then verify. If verification finds a bug you can fix in code, fix and re-verify.

**Assumption:** the human keeps the storefront app and `make dev-storefront` running. Live JS/CSS come from the dev server — **do not** treat a production rebuild as required for UI checks, and **never** start builds/watch yourself.

| Domain | When | How |
|--------|------|-----|
| **Storefront / frontend** | Twig, UX, JS, CSS/SCSS, drawers, listing UI, PDP, etc. | Chrome DevTools MCP against the live storefront base URL (dev server). Interact as needed; a11y snapshot + console errors. Prefer snapshot over full-page screenshots unless visual QA is the point. |
| **API / backend / XHR** | Controllers, `/vi/…` routes, PHP services, JSON/HTML endpoints | `curl` against affected URLs (status + body markers). Prefer theme routes from @docs/architecture.md. Avoid destructive POSTs unless the goal requires them. |
| **Admin UI** | Administration modules / CMS config | Chrome MCP: `{APP_URL}/admin`, then the relevant screen. |
| **Both** | e.g. island + controller | curl the endpoint **and** Chrome on the consuming page. |
| **Docs-only / pure refactor / no runtime surface** | no user-visible or HTTP surface | Skip live verify; state why. |

### Login rules

- **Anonymous is enough** → do not log in.
- **Logged-in storefront needed** → Chrome: open account login, fill `USER_ACCOUNT_NAME` / `USER_ACCOUNT_PASSWORT`, submit, confirm session, then run the feature check.
- **Admin UI needed** → Chrome: `{APP_URL}/admin` with `ADMIN_ACCOUNT_USER` / `ADMIN_ACCOUNT_PASSWORD`.
- **Admin API / bearer needed** → OAuth password grant with admin env vars; use `Authorization: Bearer …` on follow-ups. Never log the token or password.

### Failure policy (locked)

- Login failure, missing env vars, or storefront/admin/dev-server unreachable → mark verification **blocked**.
- **Still deliver the code** and docs updates. Do not compile or start `make dev-storefront` to unblock. Do not invent users or fake success.
- In the summary: `verify: ok` | `verify: skipped (reason)` | `verify: blocked (reason)` — e.g. `blocked (storefront unreachable)`, not “needs rebuild”.

## Done when

- Goal is implemented (or blocked only by missing clarification — then stop after the question).
- Relevant `docs/` updated when behavior or conventions changed.
- Verification ran for the task domain, or skipped/blocked with an explicit reason.
- Reply with a short bullet summary: files touched, verify result, anything left for the human. No secrets. Do not default to “please rebuild”.

