@echo off
REM =============================================================================
REM environment.bat - Variables de entorno para scripts template-dist (Windows)
REM =============================================================================

set "SCRIPT_DIR=%~dp0"

REM Archivo opcional de configuración por usuario:
REM   set "JAVA_HOME=C:\ruta\jdk"
REM   set "MAVEN_HOME=C:\ruta\maven"
REM   set "MAVEN_OPTS=-Xmx2g"
REM   set "MAVEN_USER_SETTINGS=C:\ruta\settings.xml"
REM   set "DB_URL=jdbc:postgresql://localhost:5432/template"
REM   set "DB_USERNAME=template"
REM   set "DB_PASSWORD=template"
if "%ENVIRONMENT_CONF%"=="" set "ENVIRONMENT_CONF=%SCRIPT_DIR%environment\%USERNAME%.conf.bat"
if exist "%ENVIRONMENT_CONF%" call "%ENVIRONMENT_CONF%"

if not "%JAVA_HOME%"=="" set "PATH=%JAVA_HOME%\bin;%PATH%"

if not "%MAVEN_HOME%"=="" (
    set "M2_HOME=%MAVEN_HOME%"
    set "PATH=%MAVEN_HOME%\bin;%PATH%"
)

where mvn >nul 2>&1
if errorlevel 1 (
    echo ERROR: No se encontro Maven en el PATH. Configure MAVEN_HOME o instale Maven.
    exit /b 1
)

if not "%MAVEN_USER_SETTINGS%"=="" set "MAVEN_OPTIONS=-s \"%MAVEN_USER_SETTINGS%\""

exit /b 0

