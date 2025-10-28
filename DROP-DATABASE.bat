@echo off
setlocal EnableDelayedExpansion

REM Fix working directory
cd /d "%~dp0"

REM Drop FieldServiceDB Database
REM Use this if the database was created incorrectly

echo.
echo ==========================================
echo Drop FieldServiceDB Database
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

REM Read configuration
set "DB_NAME=FieldServiceDB"
set "DB_SERVER=localhost\SQLEXPRESS"
set "DB_AUTH=Windows"
set "DB_USER=sa"

if exist "config.json" (
    echo Reading configuration from config.json...
    
    REM Extract DatabaseName
    for /f "tokens=2 delims=:," %%a in ('type "config.json" ^| findstr /C:"DatabaseName"') do (
        set "DB_NAME=%%~a"
        set "DB_NAME=!DB_NAME: =!"
        set "DB_NAME=!DB_NAME:"=!"
    )
    
    REM Extract DatabaseServer
    for /f "tokens=2 delims=:," %%a in ('type "config.json" ^| findstr /C:"DatabaseServer"') do (
        set "DB_SERVER=%%~a"
        set "DB_SERVER=!DB_SERVER: =!"
        set "DB_SERVER=!DB_SERVER:"=!"
        set "DB_SERVER=!DB_SERVER:\\=\!"
    )
    
    REM Extract DatabaseAuth
    for /f "tokens=2 delims=:," %%a in ('type "config.json" ^| findstr /C:"DatabaseAuth"') do (
        set "DB_AUTH=%%~a"
        set "DB_AUTH=!DB_AUTH: =!"
        set "DB_AUTH=!DB_AUTH:"=!"
    )
    
    REM Extract DatabaseUser
    for /f "tokens=2 delims=:," %%a in ('type "config.json" ^| findstr /C:"DatabaseUser"') do (
        set "DB_USER=%%~a"
        set "DB_USER=!DB_USER: =!"
        set "DB_USER=!DB_USER:"=!"
    )
    
    if "!DB_USER!"=="" set "DB_USER=sa"
    
    echo [OK] Configuration loaded
)

echo.
echo Database: !DB_NAME!
echo Server: !DB_SERVER!
echo Auth: !DB_AUTH!
echo.

echo This will DROP the database: !DB_NAME!
echo.
echo WARNING: This will delete ALL data in the database!
echo.
set /p CONFIRM=Are you sure you want to continue? (yes/no): 

if /i not "!CONFIRM!"=="yes" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Attempting to drop database...
echo.

REM Drop database with proper authentication
if /i "!DB_AUTH!"=="Windows" (
    echo Using Windows Authentication...
    sqlcmd -S "!DB_SERVER!" -E -d master -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name = '!DB_NAME!') BEGIN ALTER DATABASE [!DB_NAME!] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [!DB_NAME!]; PRINT 'Database dropped successfully'; END ELSE PRINT 'Database does not exist';"
    set DROP_EXIT=!errorLevel!
) else (
    echo Using SQL Authentication...
    set /p DB_PASSWORD=Enter password for !DB_USER!: 
    sqlcmd -S "!DB_SERVER!" -U "!DB_USER!" -P "!DB_PASSWORD!" -d master -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name = '!DB_NAME!') BEGIN ALTER DATABASE [!DB_NAME!] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [!DB_NAME!]; PRINT 'Database dropped successfully'; END ELSE PRINT 'Database does not exist';"
    set DROP_EXIT=!errorLevel!
)

if !DROP_EXIT! equ 0 (
    echo.
    echo [OK] Database drop completed
    echo.
    echo You can now run SETUP.bat to recreate the database.
) else (
    echo.
    echo [ERROR] Failed to drop database
    echo.
    echo Trying with SQL Authentication...
    echo.
    set /p SQL_PASSWORD=Enter SQL 'sa' password: 
    
    sqlcmd -S "!SQL_INSTANCE!" -U sa -P "!SQL_PASSWORD!" -Q "IF EXISTS (SELECT name FROM sys.databases WHERE name = '!DB_NAME!') BEGIN ALTER DATABASE [!DB_NAME!] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [!DB_NAME!]; PRINT 'Database dropped successfully'; END ELSE PRINT 'Database does not exist';"
    
    if !errorLevel! equ 0 (
        echo.
        echo [OK] Database drop completed
    ) else (
        echo.
        echo [ERROR] Failed to drop database
        echo.
        echo Please try manually in SSMS:
        echo 1. Open SQL Server Management Studio
        echo 2. Connect to !SQL_INSTANCE!
        echo 3. Right-click FieldServiceDB database
        echo 4. Select Delete
        echo 5. Check "Close existing connections"
        echo 6. Click OK
    )
)

echo.
pause
