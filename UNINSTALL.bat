@echo off
setlocal EnableDelayedExpansion

REM Uninstall Field Service Management System v2.0
REM Removes application, shortcuts, and optionally database

echo.
echo ==========================================
echo Field Service System v2.0 Uninstaller
echo ==========================================
echo.

set "INSTALL_DIR=%~dp0"
set "DB_NAME=FieldServiceDB"
set "TENANT_DB_NAME=TenantRegistry"
set "SQL_INSTANCE=.\SQLEXPRESS"
set "BACKUP_DIR=C:\FieldServiceBackups"

echo WARNING: This will remove the Field Service Management System
echo Installation Directory: %INSTALL_DIR%
echo.

choice /c YN /m "Are you sure you want to uninstall the system"
if %errorLevel% neq 1 goto :cancel

echo.
echo ==========================================
echo Step 1: Creating Final Backup
echo ==========================================
echo.

REM Create final backup before uninstall
echo Creating final backup of your data...
if exist "%INSTALL_DIR%scripts\backup-database.bat" (
    call "%INSTALL_DIR%scripts\backup-database.bat"
    echo [√] Final backup created in %BACKUP_DIR%
) else (
    echo [!] Backup script not found - skipping backup
)

echo.
echo ==========================================
echo Step 2: Stopping Services
echo ==========================================
echo.

REM Stop any running application processes
echo Stopping application processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im "Field Service*" >nul 2>&1
echo [√] Application processes stopped

REM Remove Windows service if it exists
echo Removing Windows service...
sc delete "FieldServiceAPI" >nul 2>&1
echo [√] Windows service removed (if it existed)

REM Remove scheduled backup task
echo Removing scheduled tasks...
schtasks /delete /tn "Field Service Backup" /f >nul 2>&1
echo [√] Scheduled backup task removed

echo.
echo ==========================================
echo Step 3: Removing Shortcuts
echo ==========================================
echo.

REM Remove desktop shortcuts
if exist "%USERPROFILE%\Desktop\Field Service System.lnk" (
    del "%USERPROFILE%\Desktop\Field Service System.lnk"
    echo [√] Desktop shortcut removed
)

REM Remove Start Menu shortcuts
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Field Service System" (
    rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Field Service System"
    echo [√] Start Menu shortcuts removed
)

echo.
echo ==========================================
echo Step 4: Removing Firewall Rules
echo ==========================================
echo.

REM Remove firewall rules
netsh advfirewall firewall delete rule name="Field Service API" >nul 2>&1
echo [√] Firewall rules removed

echo.
echo ==========================================
echo Step 5: Database Removal
echo ==========================================
echo.

choice /c YN /m "Do you want to remove the database and all data (this cannot be undone)"
if %errorLevel% equ 1 (
    echo Removing databases...
    
    :: Remove main database
    sqlcmd -S "%SQL_INSTANCE%" -Q "
    IF EXISTS (SELECT name FROM sys.databases WHERE name = '%DB_NAME%')
    BEGIN
        ALTER DATABASE [%DB_NAME%] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [%DB_NAME%];
        PRINT 'Database %DB_NAME% removed';
    END
    " 2>nul
    
    :: Remove tenant registry database
    sqlcmd -S "%SQL_INSTANCE%" -Q "
    IF EXISTS (SELECT name FROM sys.databases WHERE name = '%TENANT_DB_NAME%')
    BEGIN
        ALTER DATABASE [%TENANT_DB_NAME%] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
        DROP DATABASE [%TENANT_DB_NAME%];
        PRINT 'Database %TENANT_DB_NAME% removed';
    END
    " 2>nul
    
    echo [√] Databases removed
) else (
    echo [!] Databases preserved - you can remove them manually later
)

echo.
choice /c YN /m "Do you want to remove backup files"
if %errorLevel% equ 1 (
    if exist "%BACKUP_DIR%" (
        rmdir /s /q "%BACKUP_DIR%"
        echo [√] Backup directory removed: %BACKUP_DIR%
    )
) else (
    echo [!] Backup files preserved in: %BACKUP_DIR%
)

echo.
echo ==========================================
echo Step 6: Removing Application Files
echo ==========================================
echo.

REM Remove application files (but not the uninstaller itself)
echo Removing application files...

if exist "%INSTALL_DIR%server\uploads" (
    echo Removing file upload directory...
    choice /c YN /m "Remove uploaded files (attachments)"
    if !errorLevel! equ 1 (
        rmdir /s /q "%INSTALL_DIR%server\uploads"
        echo [√] Uploaded files removed
    ) else (
        echo [!] Uploaded files preserved in: %INSTALL_DIR%server\uploads
    )
)

if exist "%INSTALL_DIR%server" (
    rmdir /s /q "%INSTALL_DIR%server"
    echo [√] Server files removed
)

if exist "%INSTALL_DIR%database" (
    rmdir /s /q "%INSTALL_DIR%database"
    echo [√] Database files removed
)

if exist "%INSTALL_DIR%docs" (
    rmdir /s /q "%INSTALL_DIR%docs"
    echo [√] Documentation removed
)

if exist "%INSTALL_DIR%public" (
    rmdir /s /q "%INSTALL_DIR%public"
    echo [√] Public files removed (includes service-request.html)
)

if exist "%INSTALL_DIR%src" (
    rmdir /s /q "%INSTALL_DIR%src"
    echo [√] Source files removed
)

if exist "%INSTALL_DIR%dist" (
    rmdir /s /q "%INSTALL_DIR%dist"
    echo [√] Built client files removed
)

if exist "%INSTALL_DIR%node_modules" (
    rmdir /s /q "%INSTALL_DIR%node_modules"
    echo [√] Node modules removed
)

if exist "%INSTALL_DIR%scripts" (
    :: Don't delete the scripts folder while we're running from it
    echo [√] Scripts folder will be removed after uninstaller exits
)

REM Remove configuration files
if exist "%INSTALL_DIR%config.json" (
    echo Removing configuration files...
    choice /c YN /m "Remove config.json (contains your settings)"
    if !errorLevel! equ 1 (
        del "%INSTALL_DIR%config.json"
        echo [√] Configuration file removed
    ) else (
        echo [!] Configuration file preserved
    )
)

if exist "%INSTALL_DIR%server\.env" (
    del "%INSTALL_DIR%server\.env" >nul 2>&1
    echo [√] Environment file removed
)

REM Remove other files
del "%INSTALL_DIR%*.md" >nul 2>&1
del "%INSTALL_DIR%*.txt" >nul 2>&1
del "%INSTALL_DIR%*.json" >nul 2>&1
del "%INSTALL_DIR%*.js" >nul 2>&1
del "%INSTALL_DIR%*.ts" >nul 2>&1
del "%INSTALL_DIR%*.bat" >nul 2>&1
del "%INSTALL_DIR%SETUP.bat" >nul 2>&1
del "%INSTALL_DIR%UPDATE.bat" >nul 2>&1
del "%INSTALL_DIR%CONFIGURE.bat" >nul 2>&1

echo.
echo ==========================================
echo Optional: Remove Prerequisites
echo ==========================================
echo.

echo The following software was installed or used by Field Service System:
echo - SQL Server Express
echo - Node.js
echo.
echo These may be used by other applications on your system.
echo You can remove them manually if no longer needed:
echo.
echo To remove SQL Server Express:
echo 1. Go to Control Panel → Programs and Features
echo 2. Find "Microsoft SQL Server 2019"
echo 3. Uninstall if not needed by other applications
echo.
echo To remove Node.js:
echo 1. Go to Control Panel → Programs and Features  
echo 2. Find "Node.js"
echo 3. Uninstall if not needed by other applications

echo.
echo ==========================================
echo Uninstall Complete!
echo ==========================================
echo.
echo The Field Service Management System v2.0 has been removed.
echo.

if exist "%BACKUP_DIR%" (
    echo Your data backups are preserved in: %BACKUP_DIR%
    echo You can safely delete this folder if you no longer need the data.
)

if exist "%INSTALL_DIR%server\uploads" (
    echo.
    echo Note: Uploaded files preserved in: %INSTALL_DIR%server\uploads
    echo Delete manually if no longer needed.
)

if exist "%INSTALL_DIR%config.json" (
    echo.
    echo Note: Configuration file preserved: %INSTALL_DIR%config.json
    echo Contains your database and admin settings.
)

echo.
echo This uninstaller and the scripts folder will be removed
echo when you close this window.

goto :end

:cancel
echo Uninstall cancelled by user.
goto :end

:end
echo.
echo Press any key to finish and remove remaining files...
pause >nul

REM Self-destruct: remove the scripts folder and uninstaller
cd /d "%TEMP%"
(
echo @echo off
echo timeout /t 2 /nobreak ^>nul
echo rmdir /s /q "%INSTALL_DIR%scripts" 2^>nul
echo del "%INSTALL_DIR%UNINSTALL.bat" 2^>nul
echo rmdir "%INSTALL_DIR%" 2^>nul
) > "%TEMP%\cleanup_final.bat"

start /min cmd /c "%TEMP%\cleanup_final.bat"

exit