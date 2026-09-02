#!/bin/bash
# =============================================================================
# build.sh - Compilación del backend y frontend
# =============================================================================
# Compila el proyecto backend (Maven) y el proyecto frontend (Angular).
# Utilizar este script para verificar que ambos componentes compilan
# correctamente antes de generar artefactos de distribución.
# =============================================================================

set -e

# Directorio base (raíz del workspace)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BACKEND_DIR="${WORKSPACE_DIR}/template"
FRONTEND_DIR="${WORKSPACE_DIR}/template/dashboard"

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

cd "${BACKEND_DIR}"
mvn clean install

echo ""
echo "[OK] Backend compilado correctamente."
echo ""

# -----------------------------------------------------------------------------
# Frontend: Instalar dependencias y compilar con Angular CLI
# -----------------------------------------------------------------------------
echo "---------------------------------------------"
echo " Frontend: npm install + ng build"
echo "---------------------------------------------"

if [ ! -d "${FRONTEND_DIR}" ]; then
    echo "ERROR: No se encuentra el directorio del frontend: ${FRONTEND_DIR}"
    exit 1
fi

cd "${FRONTEND_DIR}"

echo "Instalando dependencias..."
npm install

echo "Compilando proyecto Angular..."
ng build

echo ""
echo "[OK] Frontend compilado correctamente."
echo ""

# -----------------------------------------------------------------------------
# Resumen
# -----------------------------------------------------------------------------
echo "============================================="
echo " Build completado con éxito"
echo "============================================="
