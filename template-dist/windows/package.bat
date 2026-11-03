@echo off
REM =============================================================================
REM package.bat - Empaquetado de artefactos desplegables
REM =============================================================================
REM Genera los artefactos de distribucion usando Maven.
REM El frontend se empaqueta dentro del flujo Maven segun la configuracion
REM del proyecto.
REM =============================================================================

setlocal enabledelayedexpansion

REM Directorio base (raiz del workspace)
set "SCRIPT_DIR=%~dp0"
set "WORKSPACE_DIR=%SCRIPT_DIR%..\.."

set "BACKEND_DIR=%WORKSPACE_DIR%\template"

REM Cargar variables de entorno
if exist "%SCRIPT_DIR%environment.bat" (
    call "%SCRIPT_DIR%environment.bat"
    if %errorlevel% neq 0 (
        echo ERROR: No se pudieron cargar las variables de entorno.
        exit /b 1
    )
) else (
    echo ERROR: No se encuentra el script de entorno: %SCRIPT_DIR%environment.bat
    exit /b 1
)

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
if defined MAVEN_USER_SETTINGS (
    call mvn -s "%MAVEN_USER_SETTINGS%" clean package -P dist -DskipTests
) else (
    call mvn clean package -P dist -DskipTests
)
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
REM Resumen
REM -----------------------------------------------------------------------------
echo =============================================
echo  Package completado con exito
echo =============================================
echo.
echo Artefactos generados:
echo   - Backend: %BACKEND_DIR%\webapp\target\*.war

endlocal
