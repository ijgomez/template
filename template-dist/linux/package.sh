#!/bin/bash
# =============================================================================
# package.sh - Empaquetado de artefactos desplegables
# =============================================================================
# Genera los artefactos de distribución para el backend (WAR con perfil dist)
# y el frontend (build de producción Angular).
# Los artefactos generados se encuentran en:
#   - Backend:  template/webapp/target/*.war
#   - Frontend: template-dashboard/dist/
# =============================================================================

set -e

# Directorio base (raíz del workspace)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BACKEND_DIR="${WORKSPACE_DIR}/template"
FRONTEND_DIR="${WORKSPACE_DIR}/template-dashboard"

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
mvn clean package -P dist -DskipTests

echo ""
echo "[OK] Backend empaquetado correctamente."
echo "     Artefacto: webapp/target/*.war"
echo ""

# -----------------------------------------------------------------------------
# Frontend: Build de producción
# -----------------------------------------------------------------------------
echo "---------------------------------------------"
echo " Frontend: ng build --configuration production"
echo "---------------------------------------------"

if [ ! -d "${FRONTEND_DIR}" ]; then
    echo "ERROR: No se encuentra el directorio del frontend: ${FRONTEND_DIR}"
    exit 1
fi

cd "${FRONTEND_DIR}"

echo "Instalando dependencias..."
npm install

echo "Generando build de producción..."
ng build --configuration production

echo ""
echo "[OK] Frontend empaquetado correctamente."
echo "     Artefacto: dist/"
echo ""

# -----------------------------------------------------------------------------
# Resumen
# -----------------------------------------------------------------------------
echo "============================================="
echo " Package completado con éxito"
echo "============================================="
echo ""
echo "Artefactos generados:"
echo "  - Backend:  ${BACKEND_DIR}/webapp/target/*.war"
echo "  - Frontend: ${FRONTEND_DIR}/dist/"
