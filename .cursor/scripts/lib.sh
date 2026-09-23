#!/usr/bin/env bash
# Shared helpers for the ViewsTheme Cloud Agent shop.

SHOP_ROOT="${SHOP_ROOT:-/home/ubuntu/shopware}"
SHOPWARE_VERSION="${SHOPWARE_VERSION:-6.7.14.1}"
SHOPWARE_CLI_VERSION="${SHOPWARE_CLI_VERSION:-0.18.4}"
SHOPWARE_PHP_VERSION="${SHOPWARE_PHP_VERSION:-8.3}"
STOREFRONT_URL="${STOREFRONT_URL:-http://127.0.0.1:8000}"
SCRIPT_FALLBACK_DIR="${SCRIPT_FALLBACK_DIR:-/home/ubuntu/.local/share/views-theme}"
DB_NAME="${DB_NAME:-shopware}"
DB_USER="${DB_USER:-shopware}"
DB_PASSWORD="${DB_PASSWORD:-shopware}"

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

plugin_root() {
  local candidate
  candidate="$(cd "$LIB_DIR/../.." && pwd)"
  if [[ -f "$candidate/composer.json" ]] && grep -q '"fyrst/views-theme"' "$candidate/composer.json"; then
    printf '%s\n' "$candidate"
    return 0
  fi
  if [[ -f /workspace/composer.json ]] && grep -q '"fyrst/views-theme"' /workspace/composer.json; then
    printf '%s\n' /workspace
    return 0
  fi
  echo "ViewsTheme checkout not found" >&2
  return 1
}

ensure_shopware_cli() {
  if command -v shopware-cli >/dev/null 2>&1 && shopware-cli --version 2>/dev/null | grep -q "$SHOPWARE_CLI_VERSION"; then
    return 0
  fi
  local deb="/tmp/shopware-cli_${SHOPWARE_CLI_VERSION}_linux_amd64.deb"
  curl -fsSL -o "$deb" \
    "https://github.com/shopware/shopware-cli/releases/download/${SHOPWARE_CLI_VERSION}/shopware-cli_${SHOPWARE_CLI_VERSION}_linux_amd64.deb"
  sudo dpkg -i "$deb"
}

install_script_fallback() {
  if [[ "$LIB_DIR" == "$SCRIPT_FALLBACK_DIR" ]]; then
    return 0
  fi
  mkdir -p "$SCRIPT_FALLBACK_DIR"
  cp "$LIB_DIR/lib.sh" "$SCRIPT_FALLBACK_DIR/lib.sh"
  cp "$LIB_DIR/cloud-install.sh" "$SCRIPT_FALLBACK_DIR/cloud-install.sh"
  cp "$LIB_DIR/cloud-start.sh" "$SCRIPT_FALLBACK_DIR/cloud-start.sh"
  chmod +x "$SCRIPT_FALLBACK_DIR/cloud-install.sh" "$SCRIPT_FALLBACK_DIR/cloud-start.sh"
}

mariadb_ready() {
  sudo mariadb -N -e 'SELECT 1' >/dev/null 2>&1
}

ensure_mariadb() {
  if ! command -v mariadbd >/dev/null 2>&1; then
    sudo DEBIAN_FRONTEND=noninteractive apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
      -o Dpkg::Options::=--force-confdef \
      -o Dpkg::Options::=--force-confold \
      mariadb-server
  fi

  sudo install -d -o mysql -g mysql /run/mysqld

  if ! mariadb_ready; then
    if [[ ! -d /var/lib/mysql/mysql ]]; then
      sudo mariadb-install-db --user=mysql --datadir=/var/lib/mysql
    fi
    # Snapshots keep the socket file and drop the server process.
    sudo rm -f /run/mysqld/mysqld.sock /run/mysqld/mysqld.pid
    sudo -u mysql mariadbd \
      --datadir=/var/lib/mysql \
      --bind-address=127.0.0.1 \
      --socket=/run/mysqld/mysqld.sock \
      --pid-file=/run/mysqld/mysqld.pid \
      >/tmp/mariadbd.log 2>&1 &
    local _attempt
    for _attempt in $(seq 1 60); do
      if mariadb_ready; then
        break
      fi
      sleep 1
    done
  fi

  if ! mariadb_ready; then
    echo "MariaDB did not become ready" >&2
    sudo tail -n 80 /tmp/mariadbd.log >&2 || true
    return 1
  fi

  sudo mariadb <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
}

write_plugin_link() {
  local root="$1"
  mkdir -p "$SHOP_ROOT/custom/static-plugins"
  local dest="$SHOP_ROOT/custom/static-plugins/ViewsTheme"
  if [[ -e "$dest" && ! -L "$dest" ]]; then
    rm -rf "$dest"
  fi
  ln -sfn "$root" "$dest"
}

write_env_local() {
  cat >"$SHOP_ROOT/.env.local" <<EOF
APP_URL=${STOREFRONT_URL}
DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:3306/${DB_NAME}
EOF
}

write_php_router() {
  cat >"$SHOP_ROOT/dev-router.php" <<'EOF'
<?php

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = __DIR__ . '/public' . $path;
if ($path !== '/' && is_file($file)) {
    return false;
}

require __DIR__ . '/public/index.php';
EOF
}

shop() {
  (cd "$SHOP_ROOT" && "$@")
}

ensure_storefront() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$STOREFRONT_URL" || true)"
  if [[ "$code" =~ ^[23] ]]; then
    return 0
  fi
  write_php_router
  php -S 127.0.0.1:8000 -t "$SHOP_ROOT/public" "$SHOP_ROOT/dev-router.php" >/tmp/shopware-php.log 2>&1 &
}

wait_for_storefront() {
  local _attempt code
  for _attempt in $(seq 1 90); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$STOREFRONT_URL" || true)"
    if [[ "$code" =~ ^[23] ]]; then
      echo "storefront ready ($code)"
      return 0
    fi
    sleep 2
  done
  echo "storefront did not become ready at $STOREFRONT_URL" >&2
  tail -n 40 /tmp/shopware-php.log >&2 || true
  return 1
}
