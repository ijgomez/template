#!/bin/bash
# =============================================================================
# build.sh - Compilación completa con Maven
# =============================================================================
# Ejecuta la compilación completa desde Maven.
# El frontend se compila dentro del ciclo Maven según la configuración
# del proyecto.
# =============================================================================

set -e

# Directorio base (raíz del workspace)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BACKEND_DIR="${WORKSPACE_DIR}/template"

# Cargar variables de entorno
if [ -f "${SCRIPT_DIR}/environment.sh" ]; then
    # shellcheck disable=SC1091
    source "${SCRIPT_DIR}/environment.sh"
else
    echo "ERROR: No se encuentra el script de entorno: ${SCRIPT_DIR}/environment.sh"
    exit 1
fi

echo "============================================="
echo " Template - Build"
echo "============================================="
echo ""
echo "Workspace: ${WORKSPACE_DIR}"
echo ""

# -----------------------------------------------------------------------------
# Backend: Compilar con Maven
# -----------------------------------------------------------------------------
echo "---------------------------------------------"
echo " Backend: mvn clean install"
echo "---------------------------------------------"

if [ ! -d "${BACKEND_DIR}" ]; then
    echo "ERROR: No se encuentra el directorio del backend: ${BACKEND_DIR}"
    exit 1
fi

# Perfil Maven opcional (local, dist, test). Sin argumento se usa el por defecto seguro (dist, SEC-04).
PROFILE_ARGS=()
if [ -n "${1:-}" ]; then
    PROFILE_ARGS=(-P "$1")
    echo "Perfil Maven: $1"
fi

cd "${BACKEND_DIR}"
if [ -n "${MAVEN_USER_SETTINGS:-}" ]; then
    mvn -s "${MAVEN_USER_SETTINGS}" "${PROFILE_ARGS[@]}" clean install
else
    mvn "${PROFILE_ARGS[@]}" clean install
fi

echo ""
echo "[OK] Backend compilado correctamente."
echo ""

# -----------------------------------------------------------------------------
# Resumen
# -----------------------------------------------------------------------------
echo "============================================="
echo " Build completado con éxito"
echo "============================================="
