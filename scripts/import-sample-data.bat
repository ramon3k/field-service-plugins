@echo off
setlocal EnableDelayedExpansion

REM Import Sample Data Script
REM Loads sample customers, sites, and tickets for demonstration

echo.
echo ==========================================
echo Importing Sample Data
echo ==========================================
echo.

set "DB_NAME=FieldServiceDB"
set "SQL_INSTANCE=.\SQLEXPRESS"

REM Get parent directory (installation root)
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
for %%I in ("%SCRIPT_DIR%") do set "INSTALL_DIR=%%~dpI"
set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo Database: !DB_NAME!
echo Instance: !SQL_INSTANCE!
echo Install directory: !INSTALL_DIR!
echo.

REM Check if sqlcmd is available
where sqlcmd >nul 2>&1
if !errorLevel! neq 0 (
    echo ERROR: sqlcmd not found in PATH
    echo SQL Server may not be installed correctly
    exit /b 1
)

REM Check if sample data file exists
set "SQL_FILE=!INSTALL_DIR!\database\import-sample-data.sql"
echo Checking for SQL file: !SQL_FILE!

if exist "!SQL_FILE!" (
    echo [OK] Found sample data file, importing...
    sqlcmd -S "!SQL_INSTANCE!" -d "!DB_NAME!" -i "!SQL_FILE!"
    if !errorLevel! equ 0 (
        echo [OK] Sample data imported successfully
    ) else (
        echo WARNING: Sample data import had issues
    )
    goto :import_done
)

echo WARNING: Sample data file not found at: !SQL_FILE!
echo Skipping sample data import

:import_done
echo.
echo Sample data import process completed
exit /b 0
echo - Demo service tickets
echo - Test user accounts
echo - Sample assets
echo.
echo You can modify or delete this sample data
echo after setting up your real customers.

exit /b 0