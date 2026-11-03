#!/bin/bash
# =============================================================================
# package.sh - Empaquetado de artefactos desplegables
# =============================================================================
# Genera los artefactos de distribución usando Maven.
# El frontend se empaqueta dentro del flujo Maven según la configuración
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
echo " Template - Package"
echo "============================================="
echo ""
echo "Workspace: ${WORKSPACE_DIR}"
echo ""

# -----------------------------------------------------------------------------
# Backend: Empaquetar con perfil dist
# -----------------------------------------------------------------------------
echo "---------------------------------------------"
echo " Backend: mvn clean package -P dist"
echo "---------------------------------------------"

if [ ! -d "${BACKEND_DIR}" ]; then
    echo "ERROR: No se encuentra el directorio del backend: ${BACKEND_DIR}"
    exit 1
fi

cd "${BACKEND_DIR}"
if [ -n "${MAVEN_USER_SETTINGS:-}" ]; then
    mvn -s "${MAVEN_USER_SETTINGS}" clean package -P dist -DskipTests
else
    mvn clean package -P dist -DskipTests
fi

echo ""
echo "[OK] Backend empaquetado correctamente."
echo "     Artefacto: webapp/target/*.war"
echo ""

# -----------------------------------------------------------------------------
# Resumen
# -----------------------------------------------------------------------------
echo "============================================="
echo " Package completado con éxito"
echo "============================================="
echo ""
echo "Artefactos generados:"
echo "  - Backend: ${BACKEND_DIR}/webapp/target/*.war"
