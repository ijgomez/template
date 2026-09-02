@echo off
REM =============================================================================
REM package.bat - Empaquetado de artefactos desplegables
REM =============================================================================
REM Genera los artefactos de distribucion para el backend (WAR con perfil dist)
REM y el frontend (build de produccion Angular).
REM Los artefactos generados se encuentran en:
REM   - Backend:  template\webapp\target\*.war
REM   - Frontend: template\dashboard\dist\
REM =============================================================================

setlocal enabledelayedexpansion

REM Directorio base (raiz del workspace)
set "SCRIPT_DIR=%~dp0"
set "WORKSPACE_DIR=%SCRIPT_DIR%..\.."

set "BACKEND_DIR=%WORKSPACE_DIR%\template"
set "FRONTEND_DIR=%WORKSPACE_DIR%\template\dashboard"

echo =============================================
echo  Template - Package
echo =============================================
echo.
echo Workspace: %WORKSPACE_DIR%
echo.

REM -----------------------------------------------------------------------------
REM Backend: Empaquetar con perfil dist
REM -----------------------------------------------------------------------------
echo ---------------------------------------------
echo  Backend: mvn clean package -P dist
echo ---------------------------------------------

if not exist "%BACKEND_DIR%" (
    echo ERROR: No se encuentra el directorio del backend: %BACKEND_DIR%
    exit /b 1
)

pushd "%BACKEND_DIR%"
call mvn clean package -P dist -DskipTests
if %errorlevel% neq 0 (
    echo ERROR: El empaquetado del backend ha fallado.
    popd
    exit /b 1
)
popd

echo.
echo [OK] Backend empaquetado correctamente.
echo      Artefacto: webapp\target\*.war
echo.

REM -----------------------------------------------------------------------------
REM Frontend: Build de produccion
REM -----------------------------------------------------------------------------
echo ---------------------------------------------
echo  Frontend: ng build --configuration production
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

echo Generando build de produccion...
call ng build --configuration production
if %errorlevel% neq 0 (
    echo ERROR: El build de produccion del frontend ha fallado.
    popd
    exit /b 1
)
popd

echo.
echo [OK] Frontend empaquetado correctamente.
echo      Artefacto: dist\
echo.

REM -----------------------------------------------------------------------------
REM Resumen
REM -----------------------------------------------------------------------------
echo =============================================
echo  Package completado con exito
echo =============================================
echo.
echo Artefactos generados:
echo   - Backend:  %BACKEND_DIR%\webapp\target\*.war
echo   - Frontend: %FRONTEND_DIR%\dist\

endlocal
