@echo off
REM =============================================================================
REM generate-sql.bat - Generacion de SQL desde changesets Liquibase
REM =============================================================================

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "WORKSPACE_DIR=%SCRIPT_DIR%..\.."
set "BACKEND_DIR=%WORKSPACE_DIR%\template"
set "DOMAIN_DIR=%BACKEND_DIR%\domain"

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

if not exist "%DOMAIN_DIR%" (
    echo ERROR: No se encuentra el modulo domain: %DOMAIN_DIR%
    exit /b 1
)

set "CHANGELOG_PROFILE=%~1"
if "%CHANGELOG_PROFILE%"=="" set "CHANGELOG_PROFILE=master"

if /I "%CHANGELOG_PROFILE%"=="-h" goto :usage
if /I "%CHANGELOG_PROFILE%"=="--help" goto :usage

if /I "%CHANGELOG_PROFILE%"=="master" (
    set "CHANGELOG_FILE=db/changelog/db.changelog-master.xml"
) else if /I "%CHANGELOG_PROFILE%"=="local" (
    set "CHANGELOG_FILE=db/changelog/db.changelog-local.xml"
) else (
    echo ERROR: Perfil de changelog no valido: %CHANGELOG_PROFILE%
    echo Valores permitidos: master, local
    goto :usage_error
)

set "OUTPUT_FILE=%~2"
if "%OUTPUT_FILE%"=="" set "OUTPUT_FILE=%WORKSPACE_DIR%\template-dist\sql\template-%CHANGELOG_PROFILE%.sql"

set "DB_URL_VALUE=%DB_URL%"
set "DB_USERNAME_VALUE=%DB_USERNAME%"
set "DB_PASSWORD_VALUE=%DB_PASSWORD%"

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
    echo BD:           offline:postgresql (modo fallback)
)
echo.

pushd "%DOMAIN_DIR%"
set "DEFAULT_OUTPUT_FILE=%DOMAIN_DIR%\target\liquibase\migrate.sql"
if defined DB_URL (
    if defined MAVEN_USER_SETTINGS (
        call mvn -s "%MAVEN_USER_SETTINGS%" liquibase:updateSQL -Dliquibase.changeLogFile="%CHANGELOG_FILE%" -Dliquibase.url="%DB_URL%" -Dliquibase.username="%DB_USERNAME%" -Dliquibase.password="%DB_PASSWORD%" -Dliquibase.outputFile="%OUTPUT_FILE%"
    ) else (
        call mvn liquibase:updateSQL -Dliquibase.changeLogFile="%CHANGELOG_FILE%" -Dliquibase.url="%DB_URL%" -Dliquibase.username="%DB_USERNAME%" -Dliquibase.password="%DB_PASSWORD%" -Dliquibase.outputFile="%OUTPUT_FILE%"
    )
) else if defined MAVEN_USER_SETTINGS (
    call mvn -s "%MAVEN_USER_SETTINGS%" liquibase:updateSQL -Dliquibase.changeLogFile="%CHANGELOG_FILE%" -Dliquibase.url=offline:postgresql -Dliquibase.outputFile="%OUTPUT_FILE%"
) else (
    call mvn liquibase:updateSQL -Dliquibase.changeLogFile="%CHANGELOG_FILE%" -Dliquibase.url=offline:postgresql -Dliquibase.outputFile="%OUTPUT_FILE%"
)
if %errorlevel% neq 0 (
    echo ERROR: Fallo al generar SQL desde Liquibase.
    popd
    exit /b 1
)

if exist "%OUTPUT_FILE%" (
    rem OK
) else if exist "%DEFAULT_OUTPUT_FILE%" (
    copy "%DEFAULT_OUTPUT_FILE%" "%OUTPUT_FILE%" >nul
) else (
    echo ERROR: Liquibase no generó ningun archivo SQL en la salida esperada.
    popd
    exit /b 1
)

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

