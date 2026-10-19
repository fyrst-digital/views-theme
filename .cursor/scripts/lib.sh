#!/usr/bin/env bash
# Shared helpers for the ViewsTheme Cloud Agent shop.

SHOP_ROOT="${SHOP_ROOT:-/home/ubuntu/shopware}"
SHOPWARE_CLI_VERSION="${SHOPWARE_CLI_VERSION:-0.18.4}"
SHOPWARE_PHP_VERSION="${SHOPWARE_PHP_VERSION:-8.3}"
STOREFRONT_URL="${STOREFRONT_URL:-http://127.0.0.1:8000}"
SCRIPT_FALLBACK_DIR="${SCRIPT_FALLBACK_DIR:-/home/ubuntu/.local/share/views-theme}"
DB_NAME="${DB_NAME:-shopware}"
DB_USER="${DB_USER:-shopware}"
DB_PASSWORD="${DB_PASSWORD:-shopware}"

LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Minimum Shopware release that satisfies shopware/core and shopware/storefront
# in the plugin composer.json. Printed as four numeric parts (6.7.11.0).
required_shopware_version() {
  local composer_json="$1/composer.json"
  if [[ ! -f "$composer_json" ]]; then
    echo "Plugin composer.json not found at ${composer_json}" >&2
    return 1
  fi
  python3 - "$composer_json" <<'PY'
import itertools
import json
import re
import sys

TOKEN = re.compile(r"(>=|<=|!=|>|<|\^|~|=)?\s*(v?\d+(?:\.(?:\d+|\*))+(?:\.(?:\d+|\*))?|v?\d+(?:\.\*)?)")
STABILITY = ("@stable", "@RC", "@rc", "@beta", "@alpha", "@dev")

def fail(message):
    print(message, file=sys.stderr)
    raise SystemExit(1)

def parse_version(raw):
    text = raw.strip()
    if text[:1] in ("v", "V"):
        text = text[1:]
    text = text.split("-", 1)[0]
    parts = []
    for piece in text.split("."):
        if piece == "*":
            parts.append(0)
        elif piece.isdigit():
            parts.append(int(piece))
        else:
            fail(f"unsupported Shopware version token: {raw}")
    if len(parts) > 4:
        fail(f"unsupported Shopware version token: {raw}")
    while len(parts) < 4:
        parts.append(0)
    return tuple(parts)

def explicit_length(raw):
    text = raw.strip()
    if text[:1] in ("v", "V"):
        text = text[1:]
    text = text.split("-", 1)[0].rstrip(".")
    if not text:
        return 0
    return len([piece for piece in text.split(".") if piece != "*"])

def caret_upper(bound):
    parts = list(bound)
    if parts[0] > 0:
        return (parts[0] + 1, 0, 0, 0)
    if parts[1] > 0:
        return (0, parts[1] + 1, 0, 0)
    return (0, 0, parts[2] + 1, 0)

def tilde_upper(bound, raw):
    parts = list(bound)
    index = max(explicit_length(raw) - 2, 0)
    parts[index] += 1
    for cursor in range(index + 1, 4):
        parts[cursor] = 0
    return tuple(parts)

def wildcard_match(version, raw):
    text = raw.strip()
    if text[:1] in ("v", "V"):
        text = text[1:]
    text = text.split("-", 1)[0]
    for index, piece in enumerate(text.split(".")):
        if piece == "*":
            return True
        if version[index] != int(piece):
            return False
    return True

def tokens(expr):
    found = list(TOKEN.finditer(expr))
    if not found:
        fail(f"unsupported Shopware constraint: {expr}")
    leftover = TOKEN.sub("", expr)
    for flag in STABILITY:
        leftover = leftover.replace(flag, "")
    if re.sub(r"[\s,]+", "", leftover):
        fail(f"unsupported Shopware constraint: {expr}")
    return found

def and_lower(expr):
    floors = []
    for match in tokens(expr):
        op = match.group(1) or "="
        raw = match.group(2)
        bound = parse_version(raw)
        if op in ("<", "<=", "!="):
            continue
        if op == ">":
            parts = list(bound)
            parts[-1] += 1
            floors.append(tuple(parts))
        else:
            floors.append(bound)
    if not floors:
        return (0, 0, 0, 0)
    return max(floors)

def satisfies_and(version, expr):
    for match in tokens(expr):
        op = match.group(1) or "="
        raw = match.group(2)
        if "*" in raw:
            if not wildcard_match(version, raw):
                return False
            continue
        bound = parse_version(raw)
        if op == "=":
            if version != bound:
                return False
        elif op == ">=":
            if version < bound:
                return False
        elif op == ">":
            if version <= bound:
                return False
        elif op == "<":
            if version >= bound:
                return False
        elif op == "<=":
            if version > bound:
                return False
        elif op == "!=":
            if version == bound:
                return False
        elif op == "^":
            if version < bound or version >= caret_upper(bound):
                return False
        elif op == "~":
            if version < bound or version >= tilde_upper(bound, raw):
                return False
        else:
            fail(f"unsupported Shopware operator: {op}")
    return True

def alternatives(constraint):
    parts = [part.strip() for part in re.split(r"\s*\|\|\s*", constraint.strip()) if part.strip()]
    if not parts:
        fail(f"unsupported Shopware constraint: {constraint}")
    return parts

data = json.loads(open(sys.argv[1], encoding="utf-8").read())
require = data.get("require") or {}
constraints = []
for name in ("shopware/core", "shopware/storefront"):
    value = require.get(name)
    if not isinstance(value, str) or not value.strip():
        fail(f"{name} constraint is missing from {sys.argv[1]}")
    constraints.append(value.strip())

candidates = []
for combo in itertools.product(*(alternatives(item) for item in constraints)):
    floor = (0, 0, 0, 0)
    for expr in combo:
        floor = max(floor, and_lower(expr))
    if all(satisfies_and(floor, expr) for expr in combo):
        candidates.append(floor)

if not candidates:
    fail("no Shopware release satisfies " + " and ".join(constraints))

print(".".join(str(part) for part in min(candidates)))
PY
}

installed_shopware_version() {
  local lock="$1"
  if [[ ! -f "$lock" ]]; then
    echo "Shopware composer.lock not found at ${lock}" >&2
    return 1
  fi
  python3 - "$lock" <<'PY'
import json
import sys

lock = json.load(open(sys.argv[1], encoding="utf-8"))
for package in lock.get("packages", []):
    if package.get("name") != "shopware/core":
        continue
    parts = str(package.get("version", "")).lstrip("vV").split("-", 1)[0].split(".")
    if not parts or not all(part.isdigit() for part in parts):
        print(f"unrecognized shopware/core version: {package.get('version')}", file=sys.stderr)
        raise SystemExit(1)
    while len(parts) < 4:
        parts.append("0")
    print(".".join(parts[:4]))
    raise SystemExit(0)

print("shopware/core is missing from composer.lock", file=sys.stderr)
raise SystemExit(1)
PY
}

shop_version_matches() {
  local required="$1"
  if [[ ! -f "$SHOP_ROOT/composer.lock" ]]; then
    return 1
  fi
  [[ "$(installed_shopware_version "$SHOP_ROOT/composer.lock")" == "$required" ]]
}

stop_storefront() {
  local pids pid
  pids="$(sudo ss -ltnpH "sport = :8000" 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | sort -u || true)"
  if [[ -z "${pids}" ]]; then
    return 0
  fi
  for pid in ${pids}; do
    kill "${pid}" 2>/dev/null || true
  done
  sleep 1
}

reset_shopware_project() {
  echo "Recreating ${SHOP_ROOT} so the database matches Shopware ${SHOPWARE_VERSION}."
  stop_storefront
  if [[ -e "$SHOP_ROOT" ]]; then
    rm -rf "$SHOP_ROOT"
  fi
  sudo mariadb -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`;"
  ensure_mariadb
}

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
