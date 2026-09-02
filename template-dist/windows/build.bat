@echo off
REM =============================================================================
REM build.bat - Compilacion del backend y frontend
REM =============================================================================
REM Compila el proyecto backend (Maven) y el proyecto frontend (Angular).
REM Utilizar este script para verificar que ambos componentes compilan
REM correctamente antes de generar artefactos de distribucion.
REM =============================================================================

setlocal enabledelayedexpansion

REM Directorio base (raiz del workspace)
set "SCRIPT_DIR=%~dp0"
set "WORKSPACE_DIR=%SCRIPT_DIR%..\.."

set "BACKEND_DIR=%WORKSPACE_DIR%\template"
set "FRONTEND_DIR=%WORKSPACE_DIR%\template\dashboard"

echo =============================================
echo  Template - Build
echo =============================================
echo.
echo Workspace: %WORKSPACE_DIR%
echo.

REM -----------------------------------------------------------------------------
REM Backend: Compilar con Maven
REM -----------------------------------------------------------------------------
echo ---------------------------------------------
echo  Backend: mvn clean install
echo ---------------------------------------------

if not exist "%BACKEND_DIR%" (
    echo ERROR: No se encuentra el directorio del backend: %BACKEND_DIR%
    exit /b 1
)

pushd "%BACKEND_DIR%"
call mvn clean install
if %errorlevel% neq 0 (
    echo ERROR: La compilacion del backend ha fallado.
    popd
    exit /b 1
)
popd

echo.
echo [OK] Backend compilado correctamente.
echo.

REM -----------------------------------------------------------------------------
REM Frontend: Instalar dependencias y compilar con Angular CLI
REM -----------------------------------------------------------------------------
echo ---------------------------------------------
echo  Frontend: npm install + ng build
echo ---------------------------------------------

if not exist "%FRONTEND_DIR%" (
    echo ERROR: No se encuentra el directorio del frontend: %FRONTEND_DIR%
    exit /b 1
)

pushd "%FRONTEND_DIR%"

echo Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: La instalacion de dependencias ha fallado.
    popd
    exit /b 1
)

echo Compilando proyecto Angular...
call ng build
if %errorlevel% neq 0 (
    echo ERROR: La compilacion del frontend ha fallado.
    popd
    exit /b 1
)
popd

echo.
echo [OK] Frontend compilado correctamente.
echo.

REM -----------------------------------------------------------------------------
REM Resumen
REM -----------------------------------------------------------------------------
echo =============================================
echo  Build completado con exito
echo =============================================

endlocal
