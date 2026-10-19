#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

# The minimum Shopware release pins dependencies Composer otherwise refuses to
# install (shopware/core 6.7.11.0 requires dompdf/dompdf 3.1.4). shopware-cli
# --no-audit is the same switch for project create.
export COMPOSER_NO_SECURITY_BLOCKING=1

ROOT="$(plugin_root)"

ensure_mariadb
ensure_php
ensure_shopware_cli
install_script_fallback

if [[ -f "$ROOT/package-lock.json" ]]; then
  npm ci --prefix "$ROOT"
fi

SHOPWARE_VERSION="$(required_shopware_version "$ROOT")"
echo "Required Shopware version (composer.json minimum): ${SHOPWARE_VERSION}"

if [[ -e "$SHOP_ROOT" ]] && ! shop_version_matches "$SHOPWARE_VERSION"; then
  reset_shopware_project
fi

if [[ ! -f "$SHOP_ROOT/composer.json" ]]; then
  mkdir -p "$(dirname "$SHOP_ROOT")"
  shopware-cli --no-interaction project create "$SHOP_ROOT" "$SHOPWARE_VERSION" \
    --php-version "$SHOPWARE_PHP_VERSION" \
    --with-elasticsearch=false \
    --no-audit
fi

if ! shop_version_matches "$SHOPWARE_VERSION"; then
  echo "Shopware project is $(installed_shopware_version "$SHOP_ROOT/composer.lock"), expected ${SHOPWARE_VERSION}." >&2
  exit 1
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
  shop shopware-cli project console plugin:list --json --no-ansi | python3 -c '
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

reinstall_shopware_database() {
  echo "Reinstalling the Shopware database before demo data generation."
  stop_storefront
  sudo mariadb -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`;"
  ensure_mariadb
  rm -f "$SHOP_ROOT/install.lock" "$SHOP_ROOT/.views-theme-assigned" "$SHOP_ROOT/.views-theme-demodata"
  shop shopware-cli project console system:install \
    --basic-setup \
    --create-database \
    --skip-first-run-wizard \
    --shop-locale=en-GB \
    --shop-currency=EUR \
    --no-interaction
  shop shopware-cli project console plugin:refresh
  shop shopware-cli project console plugin:install --activate --skip-asset-build ViewsTheme
}

ensure_demodata() {
  if [[ -f "$SHOP_ROOT/.views-theme-demodata" ]]; then
    echo "Demo catalog already present."
    return 0
  fi

  local products
  products="$(sudo mariadb -N "$DB_NAME" -e 'SELECT COUNT(*) FROM product')"
  if [[ "${products}" != "0" ]]; then
    reinstall_shopware_database
  fi

  if ! shop php -r 'require "vendor/autoload.php"; exit((class_exists("Faker\\Factory") && class_exists("Bezhanov\\Faker\\Provider\\Commerce")) ? 0 : 1);'; then
    shop composer require --dev shopware/dev-tools:^1.3 --no-interaction --no-scripts
  fi

  if ! shop_version_matches "$SHOPWARE_VERSION"; then
    echo "Installing shopware/dev-tools moved Shopware off ${SHOPWARE_VERSION}." >&2
    exit 1
  fi

  # Bounded catalog: categories, products, manufacturers, customers, orders, media, reviews.
  shop env APP_ENV=prod shopware-cli project console framework:demodata --no-interaction \
    --reset-defaults \
    --products=24 \
    --categories=4 \
    --customers=8 \
    --orders=8 \
    --media=90 \
    --manufacturers=6 \
    --reviews=12 \
    --properties=2 \
    --tags=10 \
    --sales-channel-domain=0
  shop shopware-cli project console dal:refresh:index --no-interaction
  shop shopware-cli project console cache:clear --no-interaction

  products="$(sudo mariadb -N "$DB_NAME" -e 'SELECT COUNT(*) FROM product')"
  if [[ "${products}" == "0" ]]; then
    echo "Demo data finished without product rows." >&2
    exit 1
  fi
  touch "$SHOP_ROOT/.views-theme-demodata"
  echo "Demo catalog ready (${products} product rows)."
}

ensure_demodata

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
