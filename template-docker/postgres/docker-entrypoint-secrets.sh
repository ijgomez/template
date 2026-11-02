#!/bin/bash
set -euo pipefail

CREDENTIALS_FILE="${CREDENTIALS_FILE:-/run/secrets/credentials}"
if [[ ! -r "$CREDENTIALS_FILE" ]]; then
  echo "Required credentials file is not readable: $CREDENTIALS_FILE" >&2
  exit 1
fi

POSTGRES_PASSWORD="$(sed -n 's/^postgres_password=//p' "$CREDENTIALS_FILE" | tr -d '\r')"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?postgres_password missing from credentials file}"
export POSTGRES_PASSWORD
unset POSTGRES_PASSWORD_FILE

if [[ "$#" -eq 0 ]]; then
  set -- postgres
fi
exec /usr/local/bin/docker-entrypoint.sh "$@"
