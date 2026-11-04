#!/bin/bash
# =============================================================================
# generate-sql.sh - Generación de SQL desde changesets Liquibase
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${WORKSPACE_DIR}/template"
DOMAIN_DIR="${BACKEND_DIR}/domain"

if [ -f "${SCRIPT_DIR}/environment.sh" ]; then
    # shellcheck disable=SC1091
    source "${SCRIPT_DIR}/environment.sh"
else
    echo "ERROR: No se encuentra el script de entorno: ${SCRIPT_DIR}/environment.sh"
    exit 1
fi

if [ ! -d "${DOMAIN_DIR}" ]; then
    echo "ERROR: No se encuentra el módulo domain: ${DOMAIN_DIR}"
    exit 1
fi

usage() {
    echo "Uso:"
    echo "  ./template-dist/linux/generate-sql.sh [master|local] [ruta-salida.sql]"
    echo ""
    echo "Ejemplos:"
    echo "  ./template-dist/linux/generate-sql.sh"
    echo "  ./template-dist/linux/generate-sql.sh local"
    echo "  ./template-dist/linux/generate-sql.sh master ./template-dist/sql/template-master.sql"
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    usage
    exit 0
fi

CHANGELOG_PROFILE="${1:-master}"
OUTPUT_FILE="${2:-${WORKSPACE_DIR}/template-dist/sql/template-${CHANGELOG_PROFILE}.sql}"

DB_URL_VALUE="${DB_URL:-}"
DB_USERNAME_VALUE="${DB_USERNAME:-}"
DB_PASSWORD_VALUE="${DB_PASSWORD:-}"

case "${CHANGELOG_PROFILE}" in
    master)
        CHANGELOG_FILE="db/changelog/db.changelog-master.xml"
        ;;
    local)
        CHANGELOG_FILE="db/changelog/db.changelog-local.xml"
        ;;
    *)
        echo "ERROR: Perfil de changelog no válido: ${CHANGELOG_PROFILE}"
        echo "Valores permitidos: master, local"
        usage
        exit 1
        ;;
esac

OUTPUT_DIR="$(dirname "${OUTPUT_FILE}")"
mkdir -p "${OUTPUT_DIR}"

echo "============================================="
echo " Template - Generate Liquibase SQL"
echo "============================================="
echo ""
echo "Workspace:    ${WORKSPACE_DIR}"
echo "Módulo:       ${DOMAIN_DIR}"
echo "Changelog:    ${CHANGELOG_FILE}"
echo "Salida SQL:   ${OUTPUT_FILE}"
if [ -n "${DB_URL_VALUE}" ]; then
    echo "BD:           ${DB_URL_VALUE}"
else
    echo "BD:           offline:postgresql (modo fallback)"
fi
echo ""

cd "${DOMAIN_DIR}"
DEFAULT_OUTPUT_FILE="${DOMAIN_DIR}/target/liquibase/migrate.sql"
OFFLINE_STATE_FILE="${DOMAIN_DIR}/databasechangelog.csv"

# Limpieza previa para garantizar una generación completa y reproducible:
# - El SQL por defecto del plugin (el CLI -Dliquibase.outputFile no siempre se
#   respeta, por lo que leemos SIEMPRE este fichero y lo copiamos al destino).
# - El fichero de estado offline de Liquibase (databasechangelog.csv). En modo
#   offline Liquibase usa este CSV como "estado de la base de datos"; si contiene
#   los changesets como EXECUTED, updateSQL los considera aplicados y genera un
#   SQL vacío ("Database is up to date, no changesets to execute"). Partimos
#   siempre de un estado limpio para emitir el esquema completo.
rm -f "${DEFAULT_OUTPUT_FILE}"
rm -f "${OFFLINE_STATE_FILE}"

if [ -n "${DB_URL_VALUE}" ]; then
    if [ -n "${MAVEN_USER_SETTINGS:-}" ]; then
        mvn -s "${MAVEN_USER_SETTINGS}" liquibase:updateSQL \
            -Dliquibase.propertyFileWillOverride=false \
            -Dliquibase.changeLogFile="${CHANGELOG_FILE}" \
            -Dliquibase.url="${DB_URL_VALUE}" \
            -Dliquibase.username="${DB_USERNAME_VALUE}" \
            -Dliquibase.password="${DB_PASSWORD_VALUE}" \
            -Dliquibase.outputFile="${OUTPUT_FILE}"
    else
        mvn liquibase:updateSQL \
            -Dliquibase.propertyFileWillOverride=false \
            -Dliquibase.changeLogFile="${CHANGELOG_FILE}" \
            -Dliquibase.url="${DB_URL_VALUE}" \
            -Dliquibase.username="${DB_USERNAME_VALUE}" \
            -Dliquibase.password="${DB_PASSWORD_VALUE}" \
            -Dliquibase.outputFile="${OUTPUT_FILE}"
    fi
else
    if [ -n "${MAVEN_USER_SETTINGS:-}" ]; then
        mvn -s "${MAVEN_USER_SETTINGS}" liquibase:updateSQL \
            -Dliquibase.propertyFileWillOverride=false \
            -Dliquibase.changeLogFile="${CHANGELOG_FILE}" \
            -Dliquibase.url=offline:postgresql \
            -Dliquibase.outputFile="${OUTPUT_FILE}"
    else
        mvn liquibase:updateSQL \
            -Dliquibase.propertyFileWillOverride=false \
            -Dliquibase.changeLogFile="${CHANGELOG_FILE}" \
            -Dliquibase.url=offline:postgresql \
            -Dliquibase.outputFile="${OUTPUT_FILE}"
    fi
fi

# El plugin escribe el SQL en su ruta por defecto (DEFAULT_OUTPUT_FILE), ya que
# -Dliquibase.outputFile por CLI no siempre se aplica. Copiamos ese resultado al
# destino solicitado. Si el plugin ya hubiera escrito directamente en OUTPUT_FILE,
# también es válido.
if [ -f "${DEFAULT_OUTPUT_FILE}" ]; then
    cp "${DEFAULT_OUTPUT_FILE}" "${OUTPUT_FILE}"
elif [ ! -f "${OUTPUT_FILE}" ]; then
    echo "ERROR: Liquibase no generó ningún archivo SQL en la salida esperada."
    exit 1
fi

# Verificación: el SQL debe contener al menos un changeset. Un fichero sin
# changesets suele indicar que había estado offline previo o que el changelog
# no se resolvió correctamente.
if ! grep -q "Changeset " "${OUTPUT_FILE}"; then
    echo "ERROR: El SQL generado no contiene ningún changeset: ${OUTPUT_FILE}"
    echo "       Revise el changelog (${CHANGELOG_FILE}) y que no exista estado"
    echo "       offline previo en ${OFFLINE_STATE_FILE}."
    exit 1
fi

# Limpieza del estado offline regenerado por Liquibase durante updateSQL. Es un
# artefacto de ejecución que no debe versionarse ni condicionar ejecuciones
# posteriores.
rm -f "${OFFLINE_STATE_FILE}"

echo ""
echo "[OK] SQL generado correctamente."
echo "     Archivo: ${OUTPUT_FILE}"

