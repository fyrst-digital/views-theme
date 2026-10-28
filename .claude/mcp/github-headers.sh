#!/usr/bin/env bash
# headersHelper for the "github" MCP server: reuses the token of the logged-in `gh` CLI.
set -euo pipefail

jq -n --arg t "$(gh auth token)" '{Authorization: ("Bearer " + $t)}'
