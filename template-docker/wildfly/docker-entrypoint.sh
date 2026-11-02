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

exec /opt/jboss/wildfly/bin/standalone.sh -b 0.0.0.0 -bmanagement 0.0.0.0
