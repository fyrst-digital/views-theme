#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ROOT="$(plugin_root)"

ensure_mariadb
ensure_shopware_cli

if [[ ! -f "$SHOP_ROOT/composer.json" ]]; then
  echo "Shopware project is missing at $SHOP_ROOT. Run .cursor/scripts/cloud-install.sh first." >&2
  exit 1
fi

write_plugin_link "$ROOT"
write_env_local
ensure_storefront
wait_for_storefront
