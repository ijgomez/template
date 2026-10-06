#!/usr/bin/env bash

set -euo pipefail

WILDFLY_ADMIN_USER="${WILDFLY_ADMIN_USER:-admin}"
WILDFLY_ADMIN_PASSWORD="${WILDFLY_ADMIN_PASSWORD:-admin}"

if ! grep -q "^${WILDFLY_ADMIN_USER}=" /opt/jboss/wildfly/standalone/configuration/mgmt-users.properties; then
  /opt/jboss/wildfly/bin/add-user.sh "$WILDFLY_ADMIN_USER" "$WILDFLY_ADMIN_PASSWORD" --silent
fi

exec /opt/jboss/wildfly/bin/standalone.sh -b 0.0.0.0 -bmanagement 0.0.0.0
