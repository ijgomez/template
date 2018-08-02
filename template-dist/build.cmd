:: ### -*- batch file -*- ######################################################
:: #                                                                          ##
:: #  Project compilation script                                              ##
:: #                                                                          ##
:: #############################################################################

@ECHO OFF
SETLOCAL

if "%OS%" == "Windows_NT" (
  set "DIRNAME=%~dp0%"
) else (
  set DIRNAME=.\
)

:: Read a parameters.
set PROFILE_LIST="development" "integration" "production"
set PARAMS_LIST="offline" %PROFILE_LIST%

if not "%~3"=="" (
    echo ERROR. No more than two arguments, please
    goto :usage
)

if "%1"=="" ( goto :withoutParams )

SET PARAM_FOUND=false
for %%A in (%*) do (
	for %%B in (%PARAMS_LIST%) do (
		if %%B=="%%A" SET PARAM_FOUND=true
	)
)

IF %PARAM_FOUND%==false (
	echo ERROR. invalid value in parameters: %*
	goto :usage
)

:withoutParams

set "MAVEN_OPTIONS="
set "MAVEN_PROFILE="
for %%A in (%*) do (
	
	if "%%A"=="offline" (
		set "MAVEN_OPTIONS=-o"
	) else (
		set "MAVEN_PROFILE=%%A"
		REM Now your batch file handles %%A instead of %1
		REM No need to use SHIFT anymore.
		rem ECHO %%A
	)
)

:: Read a configuration file.
if "x%PROJECT_CONF%" == "x" (
   set "PROJECT_CONF=%DIRNAME%environment\%USERNAME%.conf.cmd"
)

if exist "%PROJECT_CONF%" (
   echo Calling "%PROJECT_CONF%"
   call "%PROJECT_CONF%" %*
) else (
   echo ERROR. Config file not found "%PROJECT_CONF%"
   goto :usage
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

:: add Nexus repository certificate 
set "MAVEN_OPTS=%MAVEN_OPTS%

:: script global variables
SET PROJECT_HOME=..

if not "%MAVEN_USER_SETTINGS%"=="" ( 
	set MAVEN_OPTIONS=%MAVEN_OPTIONS% -s "%MAVEN_USER_SETTINGS%"
)

echo ===============================================================================
echo.
echo   Template Application Environment
echo.
echo   MAVEN_HOME:           %MAVEN_HOME%
echo   MAVEN_OPTS:           %MAVEN_OPTS%
echo   MAVEN_REPO:           %M2_REPO%
echo.
if not "%MAVEN_OPTIONS%"=="" (
 	echo   MAVEN OPTIONS:        %MAVEN_OPTIONS%
) 
if not "%MAVEN_PROFILE%"=="" (
 	echo   MAVEN PROFILE:        %MAVEN_PROFILE%
)
echo.   
echo   JAVA_HOME:            %JAVA_HOME%
echo   JAVA_OPTS:            %JAVA_OPTS%
echo.
echo ===============================================================================
echo.	

if not "%MAVEN_PROFILE%"=="" (
	set "MAVEN_PROFILE=-P%MAVEN_PROFILE%"
)

cd %PROJECT_HOME%

call :compile_node template-dashboard
if not "%ERRORLEVEL%" == "0" ( goto fin ) 

call :compile_maven template-app
if not "%ERRORLEVEL%" == "0" ( goto fin ) 

cd %DIRNAME%

goto fin

:compile_node

if exist %* (
	cd %*
	
	call npm install
	
	cd ..
)
exit /B %ERRORLEVEL%


:compile_maven

if exist %* (
	cd %*
	
	call mvn %MAVEN_OPTIONS% clean install
	
	cd ..
)
exit /B %ERRORLEVEL%

:usage
echo.
echo ****************************************************************************
echo usage build.cmd [profile] [offline]
echo.
echo examples: 
echo.
echo    build.cmd production
echo    build.cmd offline
echo    build.cmd production offline
echo    build.cmd
echo.
echo ****************************************************************************
echo command description:
echo.
echo profile: maven profile values: %PROFILE_LIST% (parameter optional).
echo offline: maven not connect to internet to download dependencies (parameter optional).
echo.

:fin
ENDLOCAL
exit /B %ERRORLEVEL%
