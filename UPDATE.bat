@echo off
setlocal EnableDelayedExpansion
cls

REM Field Service Management System - Update Script
REM Updates existing installation with new features and database schema

echo.
echo ========================================
echo  Field Service Management System
echo  Update Script
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator.
    echo.
    echo Please:
    echo 1. Right-click on UPDATE.bat
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [√] Running with Administrator privileges
echo.

REM Set variables
set "INSTALL_DIR=%~dp0"
set "DB_NAME=FieldServiceDB"
set "LOG_FILE=%INSTALL_DIR%update.log"

echo Update started at %date% %time% > "%LOG_FILE%"
echo Installation Directory: %INSTALL_DIR%
echo.

REM Create backup before updating
echo ========================================
echo Step 1: Creating Backup
echo ========================================
echo.

echo Creating backup before update...
call "%INSTALL_DIR%scripts\backup-database.bat"
if !errorLevel! equ 0 (
    echo [√] Backup created successfully
    echo [√] Backup completed >> "%LOG_FILE%"
) else (
    echo [!] Backup failed - continuing anyway
    echo WARNING: Backup failed >> "%LOG_FILE%"
    choice /c YN /m "Continue without backup"
    if !errorLevel! equ 2 exit /b 1
)

REM Stop running services
echo.
echo ========================================
echo Step 2: Stopping Services
echo ========================================
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
if !errorLevel! equ 0 (
    echo [√] Node.js processes stopped
) else (
    echo [!] No running Node.js processes found
)
timeout /t 2 /nobreak >nul

REM Update Node dependencies
echo.
echo ========================================
echo Step 3: Updating Dependencies
echo ========================================
echo.

echo Updating server dependencies...
cd /d "%INSTALL_DIR%server"
if exist package.json (
    call npm install --production
    if !errorLevel! equ 0 (
        echo [√] Server dependencies updated
        echo [√] Server dependencies updated >> "%LOG_FILE%"
    ) else (
        echo [X] Failed to update server dependencies
        echo ERROR: Server dependencies update failed >> "%LOG_FILE%"
    )
)

echo.
echo Updating client dependencies...
cd /d "%INSTALL_DIR%"
if exist package.json (
    call npm install
    if !errorLevel! equ 0 (
        echo [√] Client dependencies updated
        echo [√] Client dependencies updated >> "%LOG_FILE%"
    ) else (
        echo [!] Client dependencies update had issues
    )
)

REM Update database schema
echo.
echo ========================================
echo Step 4: Updating Database Schema
echo ========================================
echo.

echo Updating database schema with new features...
echo.
echo New features being added:
echo  • Service Requests table (public submissions)
echo  • Attachments table (file uploads)
echo  • Activity Log timezone support
echo  • Enhanced indexes for performance
echo.

REM Run database update script
sqlcmd -S localhost\SQLEXPRESS -d %DB_NAME% -E -i "%INSTALL_DIR%database\update-schema.sql" 2>nul
if !errorLevel! equ 0 (
    echo [√] Database schema updated successfully
    echo [√] Database schema update completed >> "%LOG_FILE%"
) else (
    echo [!] Database update had some issues - may already be up to date
    echo INFO: Database update issues (may be normal) >> "%LOG_FILE%"
)

REM Create uploads directory
echo.
echo ========================================
echo Step 5: Creating Upload Directories
echo ========================================
echo.

if not exist "%INSTALL_DIR%server\uploads" (
    mkdir "%INSTALL_DIR%server\uploads"
    echo [√] Created uploads directory
) else (
    echo [√] Uploads directory already exists
)

REM Set permissions on uploads directory
icacls "%INSTALL_DIR%server\uploads" /grant Users:F /T >nul 2>&1
echo [√] Upload directory permissions configured

REM Reinstall plugins to restore dependencies
echo.
echo ========================================
echo Step 6: Reinstalling Plugins
echo ========================================
echo.

echo Checking for installed plugins...
set PLUGIN_COUNT=0
for /d %%p in ("%INSTALL_DIR%server\plugins\*") do (
    if exist "%%p\plugin.json" (
        set /a PLUGIN_COUNT+=1
        set "PLUGIN_NAME=%%~nxp"
        echo Found plugin: !PLUGIN_NAME!
        
        REM Install dependencies if package.json exists
        if exist "%%p\package.json" (
            echo   Installing dependencies for !PLUGIN_NAME!...
            cd /d "%%p"
            call npm install --silent >nul 2>&1
            if !errorLevel! equ 0 (
                echo   [√] Dependencies installed
            ) else (
                echo   [!] Had issues installing dependencies
            )
            cd /d "%INSTALL_DIR%"
        )
        
        REM Copy frontend files if they exist
        if exist "%%p\frontend" (
            echo   Copying frontend files for !PLUGIN_NAME!...
            if not exist "%INSTALL_DIR%src\components\plugins" (
                mkdir "%INSTALL_DIR%src\components\plugins"
            )
            xcopy "%%p\frontend\*" "%INSTALL_DIR%src\components\plugins\" /S /Y /I >nul 2>&1
            if !errorLevel! equ 0 (
                echo   [√] Frontend files copied
            ) else (
                echo   [!] Had issues copying frontend files
            )
        )
    )
)

if !PLUGIN_COUNT! equ 0 (
    echo [√] No plugins found
) else (
    echo [√] Processed !PLUGIN_COUNT! plugin(s)
)

cd /d "%INSTALL_DIR%"

REM Update public files
echo.
echo ========================================
echo Step 7: Updating Public Files
echo ========================================
echo.

if exist "%INSTALL_DIR%public\service-request.html" (
    echo [√] Service request form found
) else (
    echo [!] Service request form not found - may need manual copy
)

REM Rebuild client application
echo.
echo ========================================
echo Step 8: Rebuilding Client
echo ========================================
echo.

cd /d "%INSTALL_DIR%"
if exist "package.json" (
    echo Building client application...
    call npm run build
    if !errorLevel! equ 0 (
        echo [√] Client rebuilt successfully
        echo [√] Client rebuild completed >> "%LOG_FILE%"
    ) else (
        echo [!] Client rebuild had issues
        echo WARNING: Client rebuild issues >> "%LOG_FILE%"
    )
)

REM Update configuration
echo.
echo ========================================
echo Step 9: Updating Configuration
echo ========================================
echo.

if not exist "%INSTALL_DIR%server\.env" (
    if exist "%INSTALL_DIR%server\.env.example" (
        copy "%INSTALL_DIR%server\.env.example" "%INSTALL_DIR%server\.env" >nul
        echo [√] Created environment file from example
    )
) else (
    echo [√] Environment file already exists
)

REM Configure firewall (if needed)
echo.
echo Checking firewall configuration...
netsh advfirewall firewall show rule name="Field Service API" >nul 2>&1
if !errorLevel! neq 0 (
    netsh advfirewall firewall add rule name="Field Service API" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
    echo [√] Firewall rule added
)

echo.
echo ========================================
echo Update Complete!
echo ========================================
echo.

echo New Features Available:
echo  ✓ Public Service Request Submissions
echo  ✓ File Attachments for Tickets  
echo  ✓ Enhanced Activity Logging with Timezone Support
echo  ✓ Sequential Ticket Numbering (TKT-YYYY-MM-NNN)
echo  ✓ Performance Improvements
echo.

echo Service Request URL:
echo  http://localhost:5000/service-request.html
echo.

echo Update log saved to: %LOG_FILE%
echo.

REM Ask to restart
choice /c YN /m "Would you like to start the application now"
if !errorLevel! equ 1 (
    echo.
    echo Starting application...
    cd /d "%INSTALL_DIR%server"
    start "Field Service API" cmd /k "node api.cjs"
    timeout /t 3 /nobreak >nul
    cd /d "%INSTALL_DIR%"
    start "Field Service Client" cmd /k "npm run dev"
    timeout /t 3 /nobreak >nul
    start http://localhost:5173
    echo.
    echo Application started on http://localhost:5173
)

echo.
echo Update completed successfully!
echo.
echo IMPORTANT: Test the following features:
echo  1. Login to the application
echo  2. Create a ticket and upload an attachment
echo  3. Test the service request form
echo  4. Verify activity log shows correct times
echo.

pause
exit /b 0
