#!/usr/bin/env bash
# headersHelper for the "shopware" MCP server: prints a fresh Admin API bearer token as JSON headers.
# Credentials come from the git-ignored .env (ADMIN_ACCOUNT_USER / ADMIN_ACCOUNT_PASSWORD).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
set -a; . "$root/.env"; set +a

base_url="${SHOPWARE_URL:-http://localhost:8000}"

token="$(jq -n --arg u "$ADMIN_ACCOUNT_USER" --arg p "$ADMIN_ACCOUNT_PASSWORD" \
    '{grant_type: "password", client_id: "administration", username: $u, password: $p}' \
  | curl -fsS -X POST "$base_url/api/oauth/token" -H 'Content-Type: application/json' -d @- \
  | jq -r .access_token)"

jq -n --arg t "$token" '{Authorization: ("Bearer " + $t)}'
