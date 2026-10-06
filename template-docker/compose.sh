#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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