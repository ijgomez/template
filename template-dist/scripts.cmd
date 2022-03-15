:: ### -*- batch file -*- ######################################################
:: #                                                                          ##
:: #  Project database scripts script creation                                ##
:: #                                                                          ##
:: #############################################################################

@ECHO OFF
SETLOCAL enabledelayedexpansion

REM change CHCP to UTF-8
CHCP 65001

if "%OS%" == "Windows_NT" (
  set "DIRNAME=%~dp0%"
) else (
  set DIRNAME=.\
)

:: Read a parameters.
set PROFILE_LIST="loc" "dev" "int" "pro"
set PARAMS_LIST="offline" "test" %PROFILE_LIST%

if not "%~4"=="" (
    echo ERROR. No more than two arguments, please
    goto :usage
)

set test_found=false

if "%1"=="" ( goto :withoutParams )

:: Validating correct parameters
for %%A in (%*) do (

	set  param_found=false
	for %%B in (%PARAMS_LIST%) do (
		if %%B=="%%A" set param_found=true
	)
	if "!param_found!" == "false" (
		echo ERROR. invalid value in parameters: %%A
		goto :usage
	)
	
	if "%%A" == "test" (
		set test_found=true
	)
	
)

:withoutParams

:: Read a configuration file.
rem if "x%PROJECT_CONF%" == "x" (
   set "PROJECT_CONF=%DIRNAME%environment\%USERNAME%.conf.cmd"
rem )

if exist "%PROJECT_CONF%" (
   echo Calling "%PROJECT_CONF%"
   call "%PROJECT_CONF%" %*
) else (
   echo ERROR. Config file not found "%PROJECT_CONF%"
   goto :usage
)

:: Read maven options.
if "%test_found%" == "false" (
set "MAVEN_OPTIONS=-Dmaven.test.skip=true"
) else (
set "MAVEN_OPTIONS="
)

set "MAVEN_PROFILES="
for %%A in (%*) do (
	
	if "%%A"=="offline" (
		set "MAVEN_OPTIONS=%MAVEN_OPTIONS% --offline"
	) else (
		if not "%%A"=="test" (
			
			set MAVEN_PROFILES=%%A
			rem Now your batch file handles %%A instead of %1
			rem No need to use SHIFT anymore.
			rem ECHO A=%%A M=%MAVEN_PROFILES%
		)
		
	)
)

:: Checking enviorement
if "x%JAVA_HOME%" == "x" (
	echo WARN. JAVA_HOME is not set. Unexpected results may occur.
	echo Set JAVA_HOME to the directory of your local JDK to avoid this message.
) else (
	set "PATH=%JAVA_HOME%\bin;%PATH%"
)

if "x%MAVEN_HOME%" == "x" (
	echo ERROR. MAVEN_HOME is not set.
	goto :usage
) else (
	set "M2_HOME=%MAVEN_HOME%"
	set "PATH=%MAVEN_HOME%\bin;%PATH%"
)

set MAVEN_OPTS=%MAVEN_OPTS%

:: script global variables
SET PROJECT_HOME=..

if not "%MAVEN_USER_SETTINGS%"=="" ( 
	set MAVEN_OPTIONS=%MAVEN_OPTIONS% --settings "%MAVEN_USER_SETTINGS%"
)

echo ===============================================================================
echo.
echo   Template Application Environment
echo.
echo   JAVA_HOME:            %JAVA_HOME%
echo   JAVA_OPTS:            %JAVA_OPTS%
echo.
echo   MAVEN_HOME:           %MAVEN_HOME%
echo   MAVEN_OPTS:           %MAVEN_OPTS%
echo   MAVEN_REPO:           %M2_REPO%
echo.
if not "%MAVEN_OPTIONS%"=="" (
 	echo   MAVEN OPTIONS:        %MAVEN_OPTIONS%
) 
if not "%MAVEN_PROFILES%"=="" (
 	echo   MAVEN PROFILE:        %MAVEN_PROFILES%
)
echo.
echo ===============================================================================
echo.	

if not "%MAVEN_PROFILES%"=="" (
	set "MAVEN_PROFILES=--activate-profiles %MAVEN_PROFILES%"
)

cd %PROJECT_HOME%

rem call :compile_node template-dashboard
rem if not "%ERRORLEVEL%" == "0" ( goto fin ) 

call :scripts_creation template-database
if not "%ERRORLEVEL%" == "0" ( goto fin ) 

cd %DIRNAME%

goto fin

:scripts_creation

if exist %* (
	cd %*
	
	call mvn clean liquibase:updateSQL
	
	cd ..
)
exit /B %ERRORLEVEL%


:usage
echo.
echo ****************************************************************************
echo usage scripts.cmd [profile] [test] [offline]
echo.
echo examples: 
echo.
echo    scripts.cmd pro
echo    scripts.cmd offline
echo    scripts.cmd pro offline
echo    scripts.cmd
echo.
echo ****************************************************************************
echo command description:
echo.
echo profile: maven profile values: %PROFILE_LIST% (parameter optional).
echo offline: maven not connect to internet to download dependencies (parameter optional).
echo test: maven execute test case project (parameter optional).
echo.

:fin
ENDLOCAL
exit /B %ERRORLEVEL%
