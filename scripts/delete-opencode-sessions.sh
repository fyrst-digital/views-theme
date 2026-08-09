#!/usr/bin/env bash
# Delete all OpenCode sessions for the current project (cwd-scoped list).
# Excludes the current session by default when detectable.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: delete-opencode-sessions.sh [options] [project-dir]

Delete OpenCode sessions for a project via `opencode session delete`.
Session list is scoped by the working directory OpenCode associates with the project.

Options:
  --dry-run              List sessions that would be deleted; do not delete
  --exclude <sessionID>  Session ID to keep (repeatable). Also: OPENCODE_SESSION_ID
  --all                  Do not exclude any session (including current)
  -h, --help             Show this help

Examples:
  ./scripts/delete-opencode-sessions.sh --dry-run
  ./scripts/delete-opencode-sessions.sh --exclude ses_01abc...
  OPENCODE_SESSION_ID=ses_01abc... ./scripts/delete-opencode-sessions.sh
EOF
}

resolve_opencode() {
  if command -v opencode >/dev/null 2>&1; then
    command -v opencode
    return
  fi
  local candidates=(
    "${HOME}/.cache/.bun/install/global/node_modules/opencode-linux-x64/bin/opencode"
    "${HOME}/.cache/.bun/install/global/node_modules/opencode-linux-x64-baseline/bin/opencode"
    "${HOME}/.local/bin/opencode"
  )
  local c
  for c in "${candidates[@]}"; do
    if [[ -x "$c" ]]; then
      printf '%s\n' "$c"
      return
    fi
  done
  echo "error: opencode binary not found in PATH or known install locations" >&2
  exit 127
}

DRY_RUN=0
DELETE_ALL=0
EXCLUDE_IDS=()
PROJECT_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --all)
      DELETE_ALL=1
      shift
      ;;
    --exclude)
      if [[ $# -lt 2 ]]; then
        echo "error: --exclude requires a session ID" >&2
        exit 2
      fi
      EXCLUDE_IDS+=("$2")
      shift 2
      ;;
    --exclude=*)
      EXCLUDE_IDS+=("${1#--exclude=}")
      shift
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      if [[ -n "$PROJECT_DIR" ]]; then
        echo "error: unexpected argument: $1" >&2
        exit 2
      fi
      PROJECT_DIR="$1"
      shift
      ;;
  esac
done

if [[ -n "${OPENCODE_SESSION_ID:-}" ]]; then
  EXCLUDE_IDS+=("$OPENCODE_SESSION_ID")
fi

if [[ -z "$PROJECT_DIR" ]]; then
  PROJECT_DIR="$(pwd)"
fi
if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "error: project directory does not exist: $PROJECT_DIR" >&2
  exit 1
fi
PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

OPENCODE_BIN="$(resolve_opencode)"

need_jq=0
if ! command -v jq >/dev/null 2>&1; then
  need_jq=1
fi

# Default list cap is 100; request a high limit so the full project is covered.
# CLI lists top-level sessions only; deleting a parent removes its children.
list_json="$(
  cd "$PROJECT_DIR" || exit 1
  "$OPENCODE_BIN" session list -n 999999 --format json
)"

if [[ "$need_jq" -eq 1 ]]; then
  # Minimal JSON array of objects with "id" fields — no jq fallback via python
  if ! command -v python3 >/dev/null 2>&1; then
    echo "error: jq or python3 is required to parse session list JSON" >&2
    exit 127
  fi
  mapfile -t ALL_IDS < <(printf '%s' "$list_json" | python3 -c 'import json,sys; data=json.load(sys.stdin); print("\n".join(s["id"] for s in data))')
else
  mapfile -t ALL_IDS < <(printf '%s' "$list_json" | jq -r '.[].id')
fi

if [[ ${#ALL_IDS[@]} -eq 0 || -z "${ALL_IDS[0]:-}" ]]; then
  echo "No sessions found for project: $PROJECT_DIR"
  exit 0
fi

# When running inside OpenCode and nothing excluded, keep the newest session
# (list is newest-first) so the active chat is not deleted mid-run.
if [[ "$DELETE_ALL" -eq 0 && ${#EXCLUDE_IDS[@]} -eq 0 && "${OPENCODE:-}" == "1" ]]; then
  EXCLUDE_IDS+=("${ALL_IDS[0]}")
  echo "note: OPENCODE=1 set; excluding newest session ${ALL_IDS[0]} (override with --exclude or use --all)" >&2
fi

is_excluded() {
  local id="$1" e
  for e in "${EXCLUDE_IDS[@]+"${EXCLUDE_IDS[@]}"}"; do
    [[ "$id" == "$e" ]] && return 0
  done
  return 1
}

TO_DELETE=()
SKIPPED=()
for id in "${ALL_IDS[@]}"; do
  [[ -z "$id" ]] && continue
  if [[ "$DELETE_ALL" -eq 0 ]] && is_excluded "$id"; then
    SKIPPED+=("$id")
  else
    TO_DELETE+=("$id")
  fi
done

echo "Project:  $PROJECT_DIR"
echo "opencode: $OPENCODE_BIN"
echo "Found:    ${#ALL_IDS[@]} session(s)"
echo "Skip:     ${#SKIPPED[@]} session(s)"
echo "Delete:   ${#TO_DELETE[@]} session(s)"
if [[ ${#SKIPPED[@]} -gt 0 ]]; then
  printf '  keep %s\n' "${SKIPPED[@]}"
fi

if [[ ${#TO_DELETE[@]} -eq 0 ]]; then
  echo "Nothing to delete."
  exit 0
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  printf '  would delete %s\n' "${TO_DELETE[@]}"
  echo "Dry run only; no sessions deleted."
  exit 0
fi

deleted=0
failed=0
for id in "${TO_DELETE[@]}"; do
  if (
    cd "$PROJECT_DIR" || exit 1
    "$OPENCODE_BIN" session delete "$id"
  ); then
    echo "deleted $id"
    deleted=$((deleted + 1))
  else
    echo "failed  $id" >&2
    failed=$((failed + 1))
  fi
done

echo "Done. deleted=$deleted failed=$failed skipped=${#SKIPPED[@]}"
[[ "$failed" -eq 0 ]]
