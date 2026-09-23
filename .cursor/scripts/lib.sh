#!/usr/bin/env bash
# Shared helpers for the ViewsTheme Cloud Agent shop.

SHOP_ROOT="${SHOP_ROOT:-/home/ubuntu/shopware}"
SHOPWARE_VERSION="${SHOPWARE_VERSION:-6.7.14.1}"
SHOPWARE_CLI_VERSION="${SHOPWARE_CLI_VERSION:-0.18.4}"
SHOPWARE_PHP_VERSION="${SHOPWARE_PHP_VERSION:-8.3}"
STOREFRONT_URL="${STOREFRONT_URL:-http://127.0.0.1:8000}"
SCRIPT_FALLBACK_DIR="${SCRIPT_FALLBACK_DIR:-/home/ubuntu/.local/share/views-theme}"

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

ensure_docker() {
  if ! command -v dockerd >/dev/null 2>&1; then
    sudo DEBIAN_FRONTEND=noninteractive apt-get update
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io fuse-overlayfs iptables
  fi

  sudo mkdir -p /etc/docker
  if [[ ! -f /etc/docker/daemon.json ]]; then
    sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{
  "storage-driver": "fuse-overlayfs",
  "iptables": true
}
EOF
  fi

  if [[ -x /usr/sbin/iptables-legacy ]]; then
    sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
    sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
  fi

  if ! id -nG ubuntu | grep -qw docker; then
    sudo usermod -aG docker ubuntu || true
  fi

  if sudo docker info >/dev/null 2>&1; then
    sudo chmod 666 /var/run/docker.sock || true
    return 0
  fi

  if ! pgrep -x dockerd >/dev/null 2>&1; then
    sudo mkdir -p /var/log
    sudo dockerd >/var/log/dockerd.log 2>&1 &
  fi

  local _attempt
  for _attempt in $(seq 1 60); do
    if sudo docker info >/dev/null 2>&1; then
      sudo chmod 666 /var/run/docker.sock || true
      return 0
    fi
    sleep 1
  done

  echo "dockerd did not become ready" >&2
  sudo tail -n 80 /var/log/dockerd.log >&2 || true
  return 1
}

ensure_shopware_cli() {
  if command -v shopware-cli >/dev/null 2>&1 && shopware-cli version 2>/dev/null | grep -q "$SHOPWARE_CLI_VERSION"; then
    return 0
  fi
  local deb="/tmp/shopware-cli_${SHOPWARE_CLI_VERSION}_linux_amd64.deb"
  curl -fsSL -o "$deb" \
    "https://github.com/shopware/shopware-cli/releases/download/${SHOPWARE_CLI_VERSION}/shopware-cli_${SHOPWARE_CLI_VERSION}_linux_amd64.deb"
  sudo dpkg -i "$deb"
}

install_script_fallback() {
  mkdir -p "$SCRIPT_FALLBACK_DIR"
  cp "$LIB_DIR/lib.sh" "$SCRIPT_FALLBACK_DIR/lib.sh"
  cp "$LIB_DIR/cloud-install.sh" "$SCRIPT_FALLBACK_DIR/cloud-install.sh"
  cp "$LIB_DIR/cloud-start.sh" "$SCRIPT_FALLBACK_DIR/cloud-start.sh"
  chmod +x "$SCRIPT_FALLBACK_DIR/cloud-install.sh" "$SCRIPT_FALLBACK_DIR/cloud-start.sh"
}

write_plugin_mount() {
  local root="$1"
  mkdir -p "$SHOP_ROOT/custom/static-plugins"
  local dest="$SHOP_ROOT/custom/static-plugins/ViewsTheme"
  if [[ -e "$dest" && ! -L "$dest" ]]; then
    rm -rf "$dest"
  fi
  ln -sfn "$root" "$dest"

  cat >"$SHOP_ROOT/compose.override.yaml" <<EOF
# Managed by ViewsTheme Cloud Agent scripts.
services:
  web:
    volumes:
      - ${root}:/var/www/html/custom/static-plugins/ViewsTheme
EOF
}

shop() {
  (cd "$SHOP_ROOT" && "$@")
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
  shop shopware-cli project dev status || true
  shop docker compose ps || true
  return 1
}
