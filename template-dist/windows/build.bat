@echo off
REM =============================================================================
REM build.bat - Compilacion completa con Maven
REM =============================================================================
REM Ejecuta la compilacion completa desde Maven.
REM El frontend se compila dentro del ciclo Maven segun la configuracion
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

REM Perfil Maven opcional (local, dist, test). Sin argumento se usa el por defecto seguro (dist, SEC-04).
set "PROFILE_ARGS="
if not "%~1"=="" (
    set "PROFILE_ARGS=-P %~1"
    echo Perfil Maven: %~1
)

pushd "%BACKEND_DIR%"
if defined MAVEN_USER_SETTINGS (
    call mvn -s "%MAVEN_USER_SETTINGS%" %PROFILE_ARGS% clean install
) else (
    call mvn %PROFILE_ARGS% clean install
)
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
REM Resumen
REM -----------------------------------------------------------------------------
echo =============================================
echo  Build completado con exito
echo =============================================

endlocal
