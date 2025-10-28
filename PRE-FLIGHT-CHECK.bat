@echo off
setlocal EnableDelayedExpansion
cls

REM Pre-Flight Check for Field Service Management System
REM Run this before SETUP.bat to verify your system is ready

echo.
echo ========================================
echo  Field Service Pre-Flight Check
echo ========================================
echo.
echo This tool checks if your system is ready
echo for installation. No changes will be made.
echo.
echo ========================================
echo.

set "READY=true"
set "WARNINGS=0"
set "HAS_INTERNET=false"
set "SQL_EXISTS=false"
set "NODE_EXISTS=false"

REM Check 1: Administrator Privileges
echo [1] Checking Administrator Privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo    [X] NOT running as Administrator
    echo    FIX: Right-click PRE-FLIGHT-CHECK.bat and select "Run as administrator"
    set "READY=false"
) else (
    echo    [√] Running with Administrator privileges
)
)
echo.

:: Check 2: Windows Version
echo [2] Checking Windows Version...
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo    [√] Windows Version: %VERSION%
echo.

REM Check 3: Internet Connection
echo [3] Checking Internet Connection...
ping -n 1 8.8.8.8 >nul 2>&1
if %errorLevel% equ 0 (
    echo    [√] Internet connection available
    set "HAS_INTERNET=true"
) else (
    echo    [!] No internet connection detected
    echo    NOTE: You'll need to manually download installers
    set /a WARNINGS+=1
    set "HAS_INTERNET=false"
)
echo.

REM Check 4: Disk Space
echo [4] Checking Disk Space...
set "INSTALL_DIR=%~dp0"
for /f "tokens=3" %%a in ('dir /-c "%INSTALL_DIR%" 2^>nul ^| find "bytes free"') do set "FREESPACE=%%a"
if not defined FREESPACE (
    echo    [!] Could not determine free space
    echo    NOTE: OneDrive paths may show incorrect space
    set /a WARNINGS+=1
    goto :skip_diskspace
)

set /a FREESPACE_GB=%FREESPACE:~0,-9% 2>nul
if errorlevel 1 (
    echo    [!] Could not calculate disk space
    set /a WARNINGS+=1
    goto :skip_diskspace
)

if !FREESPACE_GB! LSS 5 (
    echo    [!] WARNING: Only !FREESPACE_GB!GB free - may be incorrect for OneDrive
    set /a WARNINGS+=1
) else (
    echo    [√] Disk space: !FREESPACE_GB!GB available
)

:skip_diskspace
echo.

REM Check 5: SQL Server Status
echo [5] Checking SQL Server Express...
sc query "MSSQL$SQLEXPRESS" >nul 2>&1
if %errorLevel% equ 0 (
    echo    [√] SQL Server Express already installed
    echo    NOTE: Setup will use existing installation
    set "SQL_EXISTS=true"
) else (
    echo    [!] SQL Server Express not installed
    echo    NOTE: Setup will install it - requires ~10-15 minutes
    set "SQL_EXISTS=false"
)
echo.

REM Check 6: Node.js Status
echo [6] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
    echo    [√] Node.js already installed: !NODE_VERSION!
    set "NODE_EXISTS=true"
) else (
    echo    [!] Node.js not installed
    echo    NOTE: Setup will install it
    set "NODE_EXISTS=false"
)
echo.

:: Check 7: Required Installers (if no internet)
if "%HAS_INTERNET%"=="false" (
    echo [7] Checking Local Installers...
    
    if "%SQL_EXISTS%"=="false" (
        if exist "%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe" (
            echo    [√] SQL Server installer found locally
        ) else (
            echo    [X] SQL Server installer NOT found
            echo    REQUIRED: Download from https://go.microsoft.com/fwlink/?linkid=866658
            echo    Save as: %INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe
            set READY=false
        )
    )
    
    if "%NODE_EXISTS%"=="false" (
        if exist "%INSTALL_DIR%installers\node-v18.18.0-x64.msi" (
            echo    [√] Node.js installer found locally
        ) else (
            echo    [X] Node.js installer NOT found
            echo    REQUIRED: Download from https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi
            echo    Save to: %INSTALL_DIR%installers\
            set READY=false
        )
    )
    echo.
)

:: Check 8: Port Availability
echo [7] Checking Port Availability...
netstat -ano | findstr :5000 >nul 2>&1
if %errorLevel% equ 0 (
    echo    [!] WARNING: Port 5000 is in use
    echo    NOTE: You may need to change the port in config.json
    set /a WARNINGS+=1
) else (
    echo    [√] Port 5000 is available
)
echo.

:: Final Summary
echo ========================================
echo  Pre-Flight Check Summary
echo ========================================
echo.

if "%READY%"=="true" (
    if %WARNINGS% equ 0 (
        echo Status: [√] ALL CHECKS PASSED
        echo.
        echo Your system is ready for installation!
        echo.
        echo Next Steps:
        echo 1. Right-click SETUP.bat
        echo 2. Select "Run as administrator"
        echo 3. Follow the on-screen instructions
    ) else (
        echo Status: [√] READY WITH WARNINGS
        echo.
        echo Your system is ready, but there are %WARNINGS% warnings.
        echo Installation should work, but review warnings above.
        echo.
        echo Next Steps:
        echo 1. Review warnings above
        echo 2. Right-click SETUP.bat
        echo 3. Select "Run as administrator"
    )
) else (
    echo Status: [X] NOT READY
    echo.
    echo Please fix the issues marked with [X] above before running SETUP.bat
    echo.
    if "%HAS_INTERNET%"=="false" (
        echo OFFLINE INSTALLATION REQUIREMENTS:
        echo ----------------------------------
        if "%SQL_EXISTS%"=="false" (
            echo - Download SQL Server Express installer
        )
        if "%NODE_EXISTS%"=="false" (
            echo - Download Node.js installer
        )
        echo.
        echo See installers\README.md for download links
    )
)

echo.
echo ========================================
echo.
pause
