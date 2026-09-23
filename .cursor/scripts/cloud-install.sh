#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ROOT="$(plugin_root)"

ensure_mariadb
ensure_shopware_cli
install_script_fallback

if [[ -f "$ROOT/package-lock.json" ]]; then
  npm ci --prefix "$ROOT"
fi

if [[ ! -f "$SHOP_ROOT/composer.json" ]]; then
  mkdir -p "$(dirname "$SHOP_ROOT")"
  shopware-cli --no-interaction project create "$SHOP_ROOT" "$SHOPWARE_VERSION" \
    --php-version "$SHOPWARE_PHP_VERSION" \
    --with-elasticsearch=false
fi

write_plugin_link "$ROOT"
write_env_local

if ! shop composer show fyrst/views-theme >/dev/null 2>&1; then
  shop composer config repositories.views-theme \
    '{"type":"path","url":"custom/static-plugins/ViewsTheme","options":{"symlink":true}}'
  shop composer require fyrst/views-theme:@dev --no-interaction --no-scripts
fi

if ! shop shopware-cli project console system:is-installed; then
  shop shopware-cli project console system:install \
    --basic-setup \
    --create-database \
    --skip-first-run-wizard \
    --shop-locale=en-GB \
    --shop-currency=EUR \
    --no-interaction
fi

shop shopware-cli project console plugin:refresh

plugin_state() {
  shop shopware-cli project console plugin:list --format=json --no-ansi | python3 -c '
import json, sys
raw = sys.stdin.read()
data = json.loads(raw[raw.find("["):])
field = sys.argv[1]
for plugin in data:
    if plugin.get("name") == "ViewsTheme":
        value = plugin.get(field)
        print("yes" if value else "no")
        raise SystemExit(0)
print("missing")
' "$1"
}

if [[ "$(plugin_state name)" == "missing" ]]; then
  echo "ViewsTheme was not discovered" >&2
  exit 1
fi

if [[ "$(plugin_state installedAt)" != "yes" || "$(plugin_state active)" != "yes" ]]; then
  shop shopware-cli project console plugin:install --activate --skip-asset-build ViewsTheme
fi

if [[ ! -f "$SHOP_ROOT/.views-theme-assigned" ]]; then
  placeholder="$ROOT/src/Resources/app/storefront/dist/storefront/js/views-theme/views-theme.js"
  if [[ ! -f "$placeholder" ]]; then
    mkdir -p "$(dirname "$placeholder")"
    : > "$placeholder"
  fi
  shop shopware-cli project console cache:clear
  shop shopware-cli project console theme:refresh
  shop shopware-cli project console theme:change --all --sync ViewsTheme
  touch "$SHOP_ROOT/.views-theme-assigned"
fi

echo "ViewsTheme shop ready at $STOREFRONT_URL"
