#!/bin/sh
set -eu

if [ ! -r "${CREDENTIALS_FILE:-}" ]; then
  echo "Required credentials file is not readable: ${CREDENTIALS_FILE:-unset}" >&2
  exit 1
fi

credential() {
  key="$1"
  value="$(sed -n "s/^${key}=//p" "$CREDENTIALS_FILE" | tr -d '\r')"
  if [ -z "$value" ]; then
    echo "Required credential is missing: $key" >&2
    exit 1
  fi
  printf '%s' "$value"
}

export SECRET_KEY_BASE="$(credential openproject_secret_key_base)"
export OPENPROJECT_SEED_ADMIN_USER_PASSWORD="$(credential openproject_admin_password)"
postgres_password="$(credential postgres_password)"
postgres_user="${POSTGRES_USER:-administrador}"
openproject_db="${OPENPROJECT_DB:-openproject}"
export DATABASE_URL="postgres://${postgres_user}:${postgres_password}@postgres:5432/${openproject_db}"

if [ "$#" -eq 0 ]; then
  set -- ./docker/prod/supervisord
fi
exec ./docker/prod/entrypoint.sh "$@"
