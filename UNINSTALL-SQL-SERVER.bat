@echo off
setlocal EnableDelayedExpansion

REM Uninstall SQL Server
REM This script helps remove SQL Server 2019/2022 for clean testing

echo.
echo ==========================================
echo SQL Server Uninstaller
echo ==========================================
echo.

REM Check for admin rights
net session >nul 2>&1
if !errorLevel! neq 0 (
    echo ERROR: This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo This will uninstall SQL Server from your system.
echo.
echo WARNING: This will remove all databases and data!
echo.
set /p CONFIRM=Are you sure you want to continue? (yes/no): 

if /i not "!CONFIRM!"=="yes" (
    echo Uninstall cancelled.
    pause
    exit /b 0
)

echo.
echo Stopping SQL Server services...
net stop MSSQL$SQLEXPRESS 2>nul
net stop SQLBrowser 2>nul
net stop "SQL Server VSS Writer" 2>nul

echo.
echo Searching for SQL Server installations...
echo.

REM Find SQL Server 2019
for /f "tokens=*" %%a in ('wmic product where "Name like '%%SQL Server 2019%%'" get IdentifyingNumber^,Name /format:csv ^| findstr /v "Node"') do (
    for /f "tokens=2,3 delims=," %%b in ("%%a") do (
        echo Found: %%c
        echo Uninstalling %%c...
        msiexec /x %%b /qb /norestart
    )
)

REM Find SQL Server 2022
for /f "tokens=*" %%a in ('wmic product where "Name like '%%SQL Server 2022%%'" get IdentifyingNumber^,Name /format:csv ^| findstr /v "Node"') do (
    for /f "tokens=2,3 delims=," %%b in ("%%a") do (
        echo Found: %%c
        echo Uninstalling %%c...
        msiexec /x %%b /qb /norestart
    )
)

echo.
echo ==========================================
echo Uninstall Complete
echo ==========================================
echo.
echo SQL Server has been removed.
echo You may need to restart your computer.
echo.
echo To verify removal, open Settings > Apps
echo and check that SQL Server is no longer listed.
echo.
pause
