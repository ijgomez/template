#!/usr/bin/env bash

set -euo pipefail

WILDFLY_ADMIN_USER="${WILDFLY_ADMIN_USER:?Set WILDFLY_ADMIN_USER}"
if [[ -n "${CREDENTIALS_FILE:-}" ]]; then
  WILDFLY_ADMIN_PASSWORD="$(sed -n 's/^wildfly_admin_password=//p' "$CREDENTIALS_FILE" | tr -d '\r')"
  WILDFLY_ADMIN_PASSWORD="${WILDFLY_ADMIN_PASSWORD:?wildfly_admin_password missing from credentials file}"
else
  WILDFLY_ADMIN_PASSWORD="${WILDFLY_ADMIN_PASSWORD:?Set CREDENTIALS_FILE or WILDFLY_ADMIN_PASSWORD}"
fi

MGMT_USERS_FILE=/opt/jboss/wildfly/standalone/configuration/mgmt-users.properties
sed -i "/^${WILDFLY_ADMIN_USER}=.*$/d" "$MGMT_USERS_FILE"
/opt/jboss/wildfly/bin/add-user.sh "$WILDFLY_ADMIN_USER" "$WILDFLY_ADMIN_PASSWORD" --silent

WILDFLY_HOME=/opt/jboss/wildfly
STANDALONE_CONFIG="$WILDFLY_HOME/standalone/configuration"
HISTORY_DIR="$STANDALONE_CONFIG/standalone_xml_history"

# El CLI embebido de la construcción deja un historial current que hace fallar
# el respaldo XML del siguiente arranque si contiene varios ficheros.
if [[ -d "$HISTORY_DIR/current" ]]; then
  find "$HISTORY_DIR/current" -mindepth 1 -maxdepth 1 -type f -delete
  rmdir "$HISTORY_DIR/current" 2>/dev/null || true
fi

export POSTGRES_USER="${POSTGRES_USER:-administrador}"
export POSTGRES_JDBC_URL="${POSTGRES_JDBC_URL:-jdbc:postgresql://postgres:5432/${POSTGRES_DB:-template}}"
if [[ -n "${CREDENTIALS_FILE:-}" ]]; then
  export POSTGRES_PASSWORD="$(sed -n 's/^postgres_password=//p' "$CREDENTIALS_FILE" | tr -d '\r')"
  POSTGRES_PASSWORD="${POSTGRES_PASSWORD:?postgres_password missing from credentials file}"
fi

# Secreto JWT: Spring lo resuelve como ${JWT_SECRET} desde el entorno del proceso.
# Debe ser el mismo en todos los nodos del cluster.
if [[ -n "${CREDENTIALS_FILE:-}" ]]; then
  export JWT_SECRET="$(sed -n 's/^jwt_secret=//p' "$CREDENTIALS_FILE" | tr -d '\r')"
fi
export JWT_SECRET="${JWT_SECRET:?jwt_secret missing from credentials file (or set JWT_SECRET)}"

exec "$WILDFLY_HOME/bin/standalone.sh" -b 0.0.0.0 -bmanagement 0.0.0.0
