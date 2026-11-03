#!/bin/bash
# =============================================================================
# environment.sh - Variables de entorno para scripts template-dist (Linux/macOS)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Archivo opcional de configuración por usuario:
# export JAVA_HOME=/path/al/jdk
# export MAVEN_HOME=/path/a/maven
# export MAVEN_OPTS="-Xmx2g"
# export MAVEN_USER_SETTINGS=/path/a/settings.xml
if [ -z "${ENVIRONMENT_CONF:-}" ]; then
    ENVIRONMENT_CONF="${SCRIPT_DIR}/environment/${USER}.conf.sh"
fi

if [ -f "${ENVIRONMENT_CONF}" ]; then
    # shellcheck disable=SC1090
    source "${ENVIRONMENT_CONF}"
fi

if [ -n "${JAVA_HOME:-}" ]; then
    export PATH="${JAVA_HOME}/bin:${PATH}"
fi

if [ -n "${MAVEN_HOME:-}" ]; then
    export M2_HOME="${MAVEN_HOME}"
    export PATH="${MAVEN_HOME}/bin:${PATH}"
fi

if ! command -v mvn >/dev/null 2>&1; then
    echo "ERROR: No se encontró Maven en el PATH. Configure MAVEN_HOME o instale Maven."
    return 1 2>/dev/null || exit 1
fi
