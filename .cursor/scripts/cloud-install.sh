#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ROOT="$(plugin_root)"

ensure_docker
ensure_shopware_cli
install_script_fallback

if [[ -f "$ROOT/package-lock.json" ]]; then
  npm ci --prefix "$ROOT"
fi

if [[ ! -f "$SHOP_ROOT/composer.json" ]]; then
  mkdir -p "$(dirname "$SHOP_ROOT")"
  shopware-cli --no-interaction project create "$SHOP_ROOT" "$SHOPWARE_VERSION" \
    --docker \
    --php-version "$SHOPWARE_PHP_VERSION" \
    --with-elasticsearch=false
fi

write_plugin_mount "$ROOT"

shop shopware-cli project dev start
shop shopware-cli project dev install \
  --locale en-GB \
  --currency EUR \
  --admin-username admin \
  --admin-password shopware

if ! shop docker compose exec -T web composer show twig/html-extra >/dev/null 2>&1; then
  shop docker compose exec -T web composer config repositories.views-theme \
    '{"type":"path","url":"custom/static-plugins/ViewsTheme","options":{"symlink":true}}'
  shop docker compose exec -T web composer require fyrst/views-theme:@dev --no-interaction
fi

shop shopware-cli project console plugin:refresh

if ! shop shopware-cli project console plugin:list | grep -q 'ViewsTheme'; then
  shop docker compose exec -T web composer config repositories.views-theme \
    '{"type":"path","url":"custom/static-plugins/ViewsTheme","options":{"symlink":true}}'
  shop docker compose exec -T web composer require fyrst/views-theme:@dev --no-interaction
  shop shopware-cli project console plugin:refresh
fi

if ! shop shopware-cli project console plugin:list | grep -F 'ViewsTheme' | grep -q 'Yes'; then
  shop shopware-cli project console plugin:install --activate ViewsTheme
fi

if [[ ! -f "$SHOP_ROOT/.views-theme-assigned" ]]; then
  shop shopware-cli project console theme:change --all ViewsTheme
  touch "$SHOP_ROOT/.views-theme-assigned"
fi

echo "ViewsTheme shop ready at $STOREFRONT_URL"
