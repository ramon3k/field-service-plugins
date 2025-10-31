@echo off
setlocal EnableDelayedExpansion

REM Fix working directory
cd /d "%~dp0"

REM Clean up locked database files
REM This stops SQL Server, deletes the database files, and restarts

echo.
echo ==========================================
echo Clean Up Locked Database Files
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

set "DB_NAME=FieldServiceDB"

echo This will:
echo 1. Stop SQL Server
echo 2. Delete FieldServiceDB.mdf and FieldServiceDB_log.ldf files
echo 3. Restart SQL Server
echo.
echo WARNING: This will permanently delete all database data!
echo.
set /p CONFIRM=Are you sure you want to continue? (yes/no): 

if /i not "!CONFIRM!"=="yes" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Step 1: Stopping SQL Server...
net stop MSSQL$SQLEXPRESS
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Deleting database files...

REM Common SQL Server data file locations
set "DATA_DIR1=C:\Program Files\Microsoft SQL Server\MSSQL15.SQLEXPRESS\MSSQL\DATA"
set "DATA_DIR2=C:\Program Files\Microsoft SQL Server\MSSQL16.SQLEXPRESS\MSSQL\DATA"
set "DATA_DIR3=C:\Program Files\Microsoft SQL Server\MSSQL14.SQLEXPRESS\MSSQL\DATA"

set FILES_DELETED=0

if exist "!DATA_DIR1!\!DB_NAME!.mdf" (
    echo Found files in !DATA_DIR1!
    del /F "!DATA_DIR1!\!DB_NAME!.mdf" 2>nul
    del /F "!DATA_DIR1!\!DB_NAME!_log.ldf" 2>nul
    echo [OK] Files deleted from !DATA_DIR1!
    set FILES_DELETED=1
)

if exist "!DATA_DIR2!\!DB_NAME!.mdf" (
    echo Found files in !DATA_DIR2!
    del /F "!DATA_DIR2!\!DB_NAME!.mdf" 2>nul
    del /F "!DATA_DIR2!\!DB_NAME!_log.ldf" 2>nul
    echo [OK] Files deleted from !DATA_DIR2!
    set FILES_DELETED=1
)

if exist "!DATA_DIR3!\!DB_NAME!.mdf" (
    echo Found files in !DATA_DIR3!
    del /F "!DATA_DIR3!\!DB_NAME!.mdf" 2>nul
    del /F "!DATA_DIR3!\!DB_NAME!_log.ldf" 2>nul
    echo [OK] Files deleted from !DATA_DIR3!
    set FILES_DELETED=1
)

if !FILES_DELETED! equ 0 (
    echo [OK] No database files found to delete
)

echo.
echo Step 3: Starting SQL Server...
net start MSSQL$SQLEXPRESS

if !errorLevel! equ 0 (
    echo [OK] SQL Server restarted successfully
    echo.
    echo Database files have been removed.
    echo You can now run SETUP.bat to create a fresh database.
) else (
    echo [ERROR] Failed to restart SQL Server
    echo Please check Services (services.msc) and start it manually
)

echo.
pause
