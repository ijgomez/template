@echo off
REM =============================================================================
REM generate-sql.bat - Generacion de SQL desde changesets Liquibase
REM Equivalente a template-dist/linux/generate-sql.sh
REM =============================================================================

setlocal

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..") do set "WORKSPACE_DIR=%%~fI"
set "BACKEND_DIR=%WORKSPACE_DIR%\template"
set "DOMAIN_DIR=%BACKEND_DIR%\domain"

if exist "%SCRIPT_DIR%environment.bat" (
    call "%SCRIPT_DIR%environment.bat"
    if errorlevel 1 (
        echo ERROR: No se pudieron cargar las variables de entorno.
        exit /b 1
    )
) else (
    echo ERROR: No se encuentra el script de entorno: %SCRIPT_DIR%environment.bat
    exit /b 1
)

if not exist "%DOMAIN_DIR%" (
    echo ERROR: No se encuentra el modulo domain: %DOMAIN_DIR%
    exit /b 1
)

if /I "%~1"=="-h" goto :usage
if /I "%~1"=="--help" goto :usage

set "CHANGELOG_PROFILE=%~1"
if "%CHANGELOG_PROFILE%"=="" set "CHANGELOG_PROFILE=master"

set "OUTPUT_FILE=%~2"
if "%OUTPUT_FILE%"=="" set "OUTPUT_FILE=%WORKSPACE_DIR%\template-dist\sql\template-%CHANGELOG_PROFILE%.sql"

if /I "%CHANGELOG_PROFILE%"=="master" (
    set "CHANGELOG_FILE=db/changelog/db.changelog-master.xml"
) else if /I "%CHANGELOG_PROFILE%"=="local" (
    set "CHANGELOG_FILE=db/changelog/db.changelog-local.xml"
) else (
    echo ERROR: Perfil de changelog no valido: %CHANGELOG_PROFILE%
    echo Valores permitidos: master, local
    goto :usage_error
)

for %%I in ("%OUTPUT_FILE%") do (
    if not exist "%%~dpI" mkdir "%%~dpI"
)

echo =============================================
echo  Template - Generate Liquibase SQL
echo =============================================
echo.
echo Workspace:    %WORKSPACE_DIR%
echo Modulo:       %DOMAIN_DIR%
echo Changelog:    %CHANGELOG_FILE%
echo Salida SQL:   %OUTPUT_FILE%
if defined DB_URL (
    echo BD:           %DB_URL%
) else (
    echo BD:           offline:postgresql ^(modo fallback^)
)
echo.

pushd "%DOMAIN_DIR%"
set "DEFAULT_OUTPUT_FILE=%DOMAIN_DIR%\target\liquibase\migrate.sql"
set "OFFLINE_STATE_FILE=%DOMAIN_DIR%\databasechangelog.csv"

REM Limpieza previa: SQL por defecto del plugin y estado offline de Liquibase
REM (si existe, updateSQL consideraria los changesets aplicados y generaria SQL vacio).
if exist "%DEFAULT_OUTPUT_FILE%" del /f /q "%DEFAULT_OUTPUT_FILE%"
if exist "%OFFLINE_STATE_FILE%" del /f /q "%OFFLINE_STATE_FILE%"

set "MVN_SETTINGS="
if defined MAVEN_USER_SETTINGS set MVN_SETTINGS=-s "%MAVEN_USER_SETTINGS%"

if defined DB_URL (
    call mvn %MVN_SETTINGS% liquibase:updateSQL -Dliquibase.propertyFileWillOverride=false -Dliquibase.changeLogFile="%CHANGELOG_FILE%" -Dliquibase.url="%DB_URL%" -Dliquibase.username="%DB_USERNAME%" -Dliquibase.password="%DB_PASSWORD%" -Dliquibase.outputFile="%OUTPUT_FILE%"
) else (
    call mvn %MVN_SETTINGS% liquibase:updateSQL -Dliquibase.propertyFileWillOverride=false -Dliquibase.changeLogFile="%CHANGELOG_FILE%" -Dliquibase.url=offline:postgresql -Dliquibase.outputFile="%OUTPUT_FILE%"
)
if errorlevel 1 (
    echo ERROR: Fallo al generar SQL desde Liquibase.
    popd
    exit /b 1
)

REM El plugin escribe en su ruta por defecto; se copia al destino solicitado.
if exist "%DEFAULT_OUTPUT_FILE%" (
    copy /y "%DEFAULT_OUTPUT_FILE%" "%OUTPUT_FILE%" >nul
) else if not exist "%OUTPUT_FILE%" (
    echo ERROR: Liquibase no genero ningun archivo SQL en la salida esperada.
    popd
    exit /b 1
)

REM Fija el search_path al inicio del script generado.
set "SCHEMA_VALUE=%DB_SCHEMA%"
if "%SCHEMA_VALUE%"=="" set "SCHEMA_VALUE=template"
(
    echo SET search_path TO %SCHEMA_VALUE%, public;
    echo.
    type "%OUTPUT_FILE%"
) > "%OUTPUT_FILE%.tmp"
move /y "%OUTPUT_FILE%.tmp" "%OUTPUT_FILE%" >nul

REM Verificacion: el SQL debe contener al menos un changeset.
findstr /C:"Changeset " "%OUTPUT_FILE%" >nul
if errorlevel 1 (
    echo ERROR: El SQL generado no contiene ningun changeset: %OUTPUT_FILE%
    echo        Revise el changelog ^(%CHANGELOG_FILE%^) y que no exista estado
    echo        offline previo en %OFFLINE_STATE_FILE%.
    popd
    exit /b 1
)

REM Limpieza del estado offline regenerado por Liquibase.
if exist "%OFFLINE_STATE_FILE%" del /f /q "%OFFLINE_STATE_FILE%"

popd

echo.
echo [OK] SQL generado correctamente.
echo      Archivo: %OUTPUT_FILE%
exit /b 0

:usage
echo Uso:
echo   template-dist\windows\generate-sql.bat [master^|local] [ruta-salida.sql]
echo.
echo Ejemplos:
echo   template-dist\windows\generate-sql.bat
echo   template-dist\windows\generate-sql.bat local
echo   template-dist\windows\generate-sql.bat master template-dist\sql\template-master.sql
exit /b 0

:usage_error
call :usage
exit /b 1
