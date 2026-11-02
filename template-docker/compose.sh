#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

generate_password() {
  # 256 bits aleatorios y un carácter fijo de cada clase requerida.
  printf 'Aa1!%s' "$(openssl rand -hex 32)"
}

ensure_local_config() {
  local credentials_dir="$SCRIPT_DIR/secrets"
  local credentials_file="$credentials_dir/credentials.env"

  if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
    chmod 600 "$SCRIPT_DIR/.env"
    echo "Creado .env desde .env.example"
  fi

  if [[ ! -f "$credentials_file" ]]; then
    mkdir -p "$credentials_dir"
    chmod 700 "$credentials_dir"
    umask 077
    {
      printf 'postgres_password=%s\n' "$(generate_password)"
      printf 'wildfly_admin_password=%s\n' "$(generate_password)"
      printf 'openproject_admin_password=%s\n' "$(generate_password)"
      printf 'openproject_secret_key_base=%s\n' "$(openssl rand -hex 32)"
    } > "$credentials_file"
    chmod 600 "$credentials_file"
    echo "Creado secrets/credentials.env con credenciales aleatorias"
  fi
}

usage() {
  cat <<'EOF'
Uso: ./compose.sh <start|stop|reset>

Comandos:
  start    Arranca los servicios en segundo plano y fuerza build
  stop     Detiene y elimina los contenedores del compose
  reset    Detiene servicios, borra volumenes y arranca desde cero
EOF
}

if [[ $# -ne 1 ]]; then
  usage
  exit 1
fi

case "$1" in
  start)
    ensure_local_config
    (
      cd "$SCRIPT_DIR"
      docker compose up -d --build
    )
    ;;
  stop)
    (
      cd "$SCRIPT_DIR"
      docker compose down
    )
    ;;
  reset)
    ensure_local_config
    (
      cd "$SCRIPT_DIR"
      docker compose down -v
      docker compose up -d --build
    )
    ;;
  *)
    usage
    exit 1
    ;;
esac
