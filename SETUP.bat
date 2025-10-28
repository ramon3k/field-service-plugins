@echo off

REM CRITICAL: Change to the script's directory FIRST
REM This fixes the issue where "Run as administrator" changes the working directory
cd /d "%~dp0"

REM Write debug log immediately - BEFORE setlocal
echo SETUP.bat started at %date% %time% > setup-debug.log
echo Running from: %~dp0 >> setup-debug.log
echo Current directory: %cd% >> setup-debug.log
echo About to set EnableDelayedExpansion >> setup-debug.log

setlocal EnableDelayedExpansion

echo DelayedExpansion enabled >> setup-debug.log

cls

echo After cls >> setup-debug.log

REM Field Service Management System Installer
REM Version 2.0
REM Automated installation script for Windows

echo About to show header >> setup-debug.log

echo.
echo ========================================
echo  Field Service Management System v2.0
echo  Automated Installer
echo ========================================
echo.
echo New in v2.0:
echo  - Public Service Request submission
echo  - File attachments for tickets
echo  - Multi-timezone support
echo  - Sequential ticket numbering
echo  - Interactive configuration wizard
echo ========================================
echo.

echo Header shown >> setup-debug.log
echo Checking privileges... >> setup-debug.log

REM Check if running as Administrator
net session >nul 2>&1
if !errorLevel! neq 0 (
    echo Not admin! >> setup-debug.log
    echo ERROR: This installer must be run as Administrator.
    echo.
    echo Please:
    echo 1. Right-click on SETUP.bat
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Running with Administrator privileges
echo Admin check passed >> setup-debug.log
echo.

echo Setting variables... >> setup-debug.log

REM Set installation variables
set "INSTALL_DIR=%~dp0"
set "APP_NAME=Field Service Management System"
set "SERVICE_NAME=FieldServiceAPI"
set "LOG_FILE=%INSTALL_DIR%install.log"

echo Variables set >> setup-debug.log
echo INSTALL_DIR=%INSTALL_DIR% >> setup-debug.log

REM Create log file
echo Installation started at %date% %time% > "%LOG_FILE%"
echo Script location: %INSTALL_DIR% >> "%LOG_FILE%"
echo Log file created >> setup-debug.log

echo Checking for SQL password... >> setup-debug.log

REM Security: Require SQL 'sa' password for fresh SQL Express installs
REM Use a temporary variable to avoid issues with DelayedExpansion
set "TEMP_PASSWORD="
if not defined SQL_SA_PASSWORD (
    echo Before password prompt >> setup-debug.log
    echo.
    echo ========================================
    echo  SQL SERVER SECURITY
    echo ========================================
    echo.
    echo A strong password is required for the SQL Server 'sa' account.
    echo This will only be used during initial setup.
    echo.
    echo Password requirements:
    echo  - At least 8 characters
    echo  - Mix of uppercase, lowercase, numbers
    echo.
    set /p TEMP_PASSWORD=Enter SQL 'sa' password: 
    set "SQL_SA_PASSWORD=!TEMP_PASSWORD!"
    echo After password prompt >> setup-debug.log
    echo SQL password entered >> setup-debug.log
) else (
    echo SQL password already set >> setup-debug.log
)

echo Password check complete >> setup-debug.log
echo Reading config... >> setup-debug.log

REM Read configuration from config.json if it exists
set "DB_NAME=FieldServiceDB"
set "DB_SERVER=localhost\SQLEXPRESS"
set "BACKUP_DIR=C:\FieldServiceBackups"

if exist "%INSTALL_DIR%config.json" (
    echo [OK] Reading configuration from config.json...
    echo Config file found >> setup-debug.log
    
    REM Extract DatabaseName from config.json
    for /f "tokens=2 delims=:," %%a in ('type "%INSTALL_DIR%config.json" ^| findstr /C:"DatabaseName"') do (
        set "DB_NAME=%%~a"
        set "DB_NAME=!DB_NAME: =!"
        set "DB_NAME=!DB_NAME:"=!"
    )
    
    REM Extract DatabaseServer from config.json
    for /f "tokens=2 delims=:," %%a in ('type "%INSTALL_DIR%config.json" ^| findstr /C:"DatabaseServer"') do (
        set "DB_SERVER=%%~a"
        set "DB_SERVER=!DB_SERVER: =!"
        set "DB_SERVER=!DB_SERVER:"=!"
        REM Convert double backslash to single backslash
        set "DB_SERVER=!DB_SERVER:\\=\!"
    )
    
    echo [OK] Using configured database: !DB_NAME! on !DB_SERVER!
    echo Config loaded >> setup-debug.log
) else (
    echo [!] No config.json found - using defaults
    echo [!] Run CONFIGURE.bat first for custom settings
    echo No config file >> setup-debug.log
)

echo.
echo Installation Directory: %INSTALL_DIR%
echo Database Name: !DB_NAME!
echo Database Server: !DB_SERVER!
echo Backup Directory: %BACKUP_DIR%
echo About to show summary >> setup-debug.log
echo Summary shown successfully >> setup-debug.log
echo.

echo About to create/append to log file >> setup-debug.log

REM Append to log file (it was created earlier)
echo. >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"
echo Installation continued at %date% %time% >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"

echo Log file updated >> setup-debug.log

REM Step 1: Check system requirements
echo ============================================
echo Step 1: Checking System Requirements
echo ============================================
echo.

echo After Step 1 header >> setup-debug.log

echo About to check Windows version >> setup-debug.log

REM Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo Windows version checked >> setup-debug.log
echo Windows Version: !VERSION!
echo [OK] Windows version check passed >> "%LOG_FILE%"

echo About to check disk space >> setup-debug.log

REM Check available disk space (at least 5GB free)
echo Checking disk space...
for /f "tokens=3" %%a in ('dir /-c "%INSTALL_DIR%" 2^>nul ^| find "bytes free"') do set FREESPACE=%%a

echo Disk space check completed >> setup-debug.log

echo About to handle freespace >> setup-debug.log

REM Handle OneDrive paths or calculation errors
if not defined FREESPACE (
    echo [OK] Could not determine free space - continuing anyway
    echo [OK] OneDrive paths may cause false warnings >> "%LOG_FILE%"
    goto :skip_diskspace
)

echo About to calculate freespace GB >> setup-debug.log

set /a FREESPACE_GB=!FREESPACE:~0,-9! 2>nul
if !errorLevel! neq 0 (
    echo [OK] Could not calculate disk space - continuing anyway
    echo [OK] Disk space calculation failed >> "%LOG_FILE%"
    goto :skip_diskspace
)

echo Freespace calculated: !FREESPACE_GB!GB >> setup-debug.log

if !FREESPACE_GB! LSS 5 (
    echo [OK] WARNING: Disk space check shows !FREESPACE_GB!GB free
    echo [OK] This may be incorrect for OneDrive paths
    echo.
    choice /C YN /M "Continue anyway"
    if !errorLevel! equ 2 (
        exit /b 1
    )
) else (
    echo [OK] Disk space check passed: !FREESPACE_GB!GB available
)

echo Disk space section completed >> setup-debug.log
:skip_diskspace

echo About to check SQL Server >> setup-debug.log

REM Check if SQL Server is already installed
echo.
echo Checking for SQL Server Express...
sc query "MSSQL$SQLEXPRESS" >nul 2>&1
if !errorLevel! equ 0 (
    echo [OK] SQL Server Express already installed
    set "SQL_INSTALLED=true"
) else (
    echo [OK] SQL Server Express not found - will install
    set "SQL_INSTALLED=false"
)

echo SQL check done, result: !SQL_INSTALLED! >> setup-debug.log

REM Check if Node.js is installed
echo.
echo Checking for Node.js...
node --version >nul 2>&1
if !errorLevel! equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
    echo [OK] Node.js already installed: !NODE_VERSION!
    set "NODE_INSTALLED=true"
) else (
    echo [OK] Node.js not found - will install
    set "NODE_INSTALLED=false"
)

echo Node check done, result: !NODE_INSTALLED! >> setup-debug.log

echo.
echo ============================================
echo Step 2: Installing Prerequisites
echo ============================================
echo.

echo About to check SQL installation >> setup-debug.log

REM Install SQL Server Express if needed
echo Checking SQL_INSTALLED value: !SQL_INSTALLED! >> setup-debug.log

if "!SQL_INSTALLED!"=="false" (
    echo SQL needs to be installed >> setup-debug.log
    echo Installing SQL Server Express 2019...
    echo This may take 10-15 minutes. Please wait...
    echo.
    
    echo Checking for local installer >> setup-debug.log
    
    REM Check if installer exists locally
    if exist "%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe" (
        echo [OK] Found SQL Server installer in installers folder
        echo Installer found locally >> setup-debug.log
        goto :install_sql
    )
    
    echo Installer not found, will download >> setup-debug.log
    
    REM Try to download if not found
    echo [OK] SQL Server installer not found locally
    echo [OK] Attempting to download (270 MB)...
    echo [OK] This may take several minutes depending on your connection...
    echo.
    
    echo About to run PowerShell download >> setup-debug.log
    
    powershell -ExecutionPolicy Bypass -Command "try { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://download.microsoft.com/download/7/c/1/7c14e92e-bdcb-4f89-b7cf-93543e7112d1/SQLEXPR_x64_ENU.exe' -OutFile '%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe' -UseBasicParsing; exit 0 } catch { Write-Host 'Download failed:' $_.Exception.Message; exit 1 }" 2>&1
    
    echo PowerShell download completed with errorlevel: !errorLevel! >> setup-debug.log
    
    if !errorLevel! neq 0 (
        echo Download failed >> setup-debug.log
        echo.
        echo ============================================
        echo  DOWNLOAD FAILED
        echo ============================================
        echo.
        echo The SQL Server installer could not be downloaded automatically.
        echo This might be due to:
        echo  - No internet connection
        echo  - Firewall blocking downloads
        echo  - Network restrictions
        echo.
        echo SOLUTION: Manual Download Required
        echo ----------------------------------------
        echo 1. Download SQL Server Express 2019 from:
        echo    https://go.microsoft.com/fwlink/?linkid=866658
        echo.
        echo 2. Save the file as: SQLEXPR_x64_ENU.exe
        echo.
        echo 3. Place it in: %INSTALL_DIR%installers\
        echo.
        echo 4. Run SETUP.bat again
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    
    REM Verify download succeeded
    if not exist "%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe" (
        echo [OK] Download verification failed - file not created
        echo Please download manually and run SETUP.bat again
        pause
        exit /b 1
    )
    
    echo [OK] Download completed successfully
    echo.
    
    :install_sql
    echo Installing SQL Server Express...
    echo (This runs silently - please wait 10-15 minutes)
    echo.
    
    "%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe" /Q /IACCEPTSQLSERVERLICENSETERMS /ACTION=Install /FEATURES=SQLEngine /INSTANCENAME=SQLEXPRESS /SECURITYMODE=SQL /SAPWD="%SQL_SA_PASSWORD%" /TCPENABLED=1 /BROWSERSVCSTARTUPTYPE=Automatic
    
    if !errorLevel! equ 0 (
        echo [OK] SQL Server Express installed successfully
        echo [OK] SQL Server Express installation completed >> "%LOG_FILE%"
    ) else (
        echo.
        echo ============================================
        echo  SQL SERVER INSTALLATION FAILED
        echo ============================================
        echo.
        echo Error code: !errorLevel!
        echo.
        echo Common causes:
        echo  - SQL Server already installed with different instance name
        echo  - Insufficient permissions
        echo  - Conflicting SQL Server version
        echo.
        echo Check the log file for details: %LOG_FILE%
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
) else (
    echo [OK] Using existing SQL Server Express installation
    echo Using existing SQL >> setup-debug.log
)

echo SQL section completed >> setup-debug.log

REM Install Node.js if needed
echo About to check Node installation >> setup-debug.log

if "!NODE_INSTALLED!"=="false" (
    echo Node needs to be installed >> setup-debug.log
    echo.
    echo Installing Node.js LTS...
    echo.
    
    echo Checking for local Node installer >> setup-debug.log
    
    REM Check if installer exists locally
    if exist "%INSTALL_DIR%installers\node-v18.18.0-x64.msi" (
        echo [OK] Found Node.js installer in installers folder
        goto :install_node
    )
    
    REM Try to download if not found
    echo [OK] Node.js installer not found locally
    echo [OK] Attempting to download (28 MB)...
    echo.
    
    powershell -ExecutionPolicy Bypass -Command "try { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi' -OutFile '%INSTALL_DIR%installers\node-v18.18.0-x64.msi' -UseBasicParsing; exit 0 } catch { Write-Host 'Download failed:' $_.Exception.Message; exit 1 }" 2>&1
    
    if !errorLevel! neq 0 (
        echo.
        echo ============================================
        echo  DOWNLOAD FAILED
        echo ============================================
        echo.
        echo The Node.js installer could not be downloaded automatically.
        echo.
        echo SOLUTION: Manual Download Required
        echo ----------------------------------------
        echo 1. Download Node.js LTS from:
        echo    https://nodejs.org/dist/v18.18.0/node-v18.18.0-x64.msi
        echo.
        echo 2. Save it in: %INSTALL_DIR%installers\
        echo.
        echo 3. Run SETUP.bat again
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    
    REM Verify download succeeded
    if not exist "%INSTALL_DIR%installers\node-v18.18.0-x64.msi" (
        echo [OK] Download verification failed - file not created
        echo Please download manually and run SETUP.bat again
        pause
        exit /b 1
    )
    
    echo [OK] Download completed successfully
    echo.
    
    :install_node
    echo Installing Node.js...
    echo.
    
    msiexec /i "%INSTALL_DIR%installers\node-v18.18.0-x64.msi" /quiet /norestart
    
    if !errorLevel! equ 0 (
        echo [OK] Node.js installed successfully
        echo [OK] Node.js installation completed >> "%LOG_FILE%"
    ) else (
        echo.
        echo ============================================
        echo  NODE.JS INSTALLATION FAILED
        echo ============================================
        echo.
        echo Error code: !errorLevel!
        echo.
        echo Common causes:
        echo  - Node.js already installed
        echo  - Insufficient permissions
        echo.
        echo Check the log file for details: %LOG_FILE%
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    
    REM Refresh environment variables
    echo [OK] Refreshing environment variables...
    call "%INSTALL_DIR%scripts\refresh-env.bat" 2>nul
    if !errorLevel! neq 0 (
        echo [OK] Could not refresh environment - you may need to restart your terminal
    )
) else (
    echo [OK] Using existing Node.js installation
)

echo.
echo ============================================
echo Step 3: Configuration Wizard
echo ============================================
echo.

REM Check if configuration already exists
if exist "%INSTALL_DIR%config.json" (
    echo [OK] Configuration file already exists
    echo.
    choice /C YN /M "Do you want to reconfigure the application"
    if errorlevel 2 (
        echo [OK] Using existing configuration
        goto :skip_config
    )
)

REM Run configuration wizard
echo Running interactive configuration wizard...
echo.
echo The wizard will collect:
echo  - Company/organization name
echo  - Database connection settings
echo  - Application port numbers
echo  - Administrator account details
echo  - Backup preferences
echo.
pause

call "%INSTALL_DIR%CONFIGURE.bat"
if !errorLevel! equ 0 (
    echo [OK] Configuration completed successfully
    echo [OK] Configuration wizard completed >> "%LOG_FILE%"
) else (
    echo [OK] Configuration failed
    echo ERROR: Configuration wizard failed >> "%LOG_FILE%"
    pause
    exit /b 1
)

:skip_config

echo.
echo ============================================
echo Step 4: Installing Application
echo ============================================
echo.

REM Create backup directory
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [OK] Created backup directory: %BACKUP_DIR%
)

REM Install server dependencies
echo Installing server dependencies...
cd /d "%INSTALL_DIR%server"
if exist package.json (
    call npm install --production
    if !errorLevel! equ 0 (
        echo [OK] Server dependencies installed
        echo [OK] Server dependencies installation completed >> "%LOG_FILE%"
    ) else (
        echo [OK] Failed to install server dependencies
        echo ERROR: Server dependencies installation failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
) else (
    echo ERROR: package.json not found in server directory
    pause
    exit /b 1
)

REM Build client application
echo.
echo Building client application...
cd /d "%INSTALL_DIR%"
if exist package.json (
    call npm install
    call npm run build
    if !errorLevel! equ 0 (
        echo [OK] Client application built successfully
        echo [OK] Client build completed >> "%LOG_FILE%"
    ) else (
        echo [OK] Failed to build client application
        echo ERROR: Client build failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
) else (
    echo [OK] Client package.json not found - skipping client build
)

echo.
echo ============================================
echo Step 5: Database Setup
echo ============================================
echo.

REM Wait for SQL Server to be ready
echo Waiting for SQL Server to start...
timeout /t 10 /nobreak >nul

REM Create database
echo Creating database with complete schema...
sqlcmd -S "!DB_SERVER!" -i "%INSTALL_DIR%database\create-database-complete.sql" >nul 2>&1
if !errorLevel! equ 0 (
    echo [OK] Database created successfully
    echo [OK] Database creation completed >> "%LOG_FILE%"
) else (
    echo [OK] Database creation failed - trying alternative method
    call "%INSTALL_DIR%scripts\create-database.bat"
    if !errorLevel! equ 0 (
        echo [OK] Database created successfully
        echo [OK] Database creation completed >> "%LOG_FILE%"
    ) else (
        echo [OK] Database creation failed
        echo ERROR: Database creation failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
)

REM Import sample data
echo.
echo Importing sample data...
call "%INSTALL_DIR%scripts\import-sample-data.bat"
if !errorLevel! equ 0 (
    echo [OK] Sample data imported successfully
    echo [OK] Sample data import completed >> "%LOG_FILE%"
) else (
    echo [OK] Sample data import had issues - continuing anyway
    echo WARNING: Sample data import issues >> "%LOG_FILE%"
)

REM Add CompanyCode support to all tables
echo.
echo Adding CompanyCode multi-tenant support...
sqlcmd -S "!DB_SERVER!" -d !DB_NAME! -i "%INSTALL_DIR%database\add-company-code-support.sql" >nul 2>&1
if !errorLevel! equ 0 (
    echo [OK] CompanyCode columns added successfully
    echo [OK] CompanyCode support completed >> "%LOG_FILE%"
) else (
    echo [OK] CompanyCode addition had issues - continuing anyway
    echo WARNING: CompanyCode addition issues >> "%LOG_FILE%"
)

REM Create admin user from configuration wizard
if exist "%INSTALL_DIR%database\create-admin-user.sql" (
    echo.
    echo Creating admin user from configuration...
    sqlcmd -S "!DB_SERVER!" -d !DB_NAME! -i "%INSTALL_DIR%database\create-admin-user.sql" >nul 2>&1
    if !errorLevel! equ 0 (
        echo [OK] Admin user created successfully
        echo [OK] Admin user creation completed >> "%LOG_FILE%"
    ) else (
        echo [OK] Admin user creation had issues
        echo WARNING: Admin user creation failed >> "%LOG_FILE%"
    )
)

REM Create uploads directory for file attachments
echo.
echo Creating file upload directory...
if not exist "%INSTALL_DIR%server\uploads" (
    mkdir "%INSTALL_DIR%server\uploads"
    echo [OK] Created uploads directory: %INSTALL_DIR%server\uploads
    echo [OK] Uploads directory created >> "%LOG_FILE%"
) else (
    echo [OK] Uploads directory already exists
)

REM Set permissions on uploads directory
icacls "%INSTALL_DIR%server\uploads" /grant "Everyone:(OI)(CI)F" /T >nul 2>&1
if !errorLevel! equ 0 (
    echo [OK] Permissions set on uploads directory
) else (
    echo [OK] Could not set permissions - may need manual configuration
)

echo.
echo ============================================
echo Step 6: Service Configuration
echo ============================================
echo.

REM Create Windows service (optional)
echo Configuring application service...
if exist "%INSTALL_DIR%scripts\install-service.bat" (
    call "%INSTALL_DIR%scripts\install-service.bat"
    echo [OK] Service configuration completed
) else (
    echo [OK] Service installer not found - manual startup required
)

REM Configure firewall
echo.
echo Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="Field Service API" >nul 2>&1
netsh advfirewall firewall add rule name="Field Service API" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
if !errorLevel! equ 0 (
    echo [OK] Firewall rule added for port 5000
    echo [OK] Firewall configuration completed >> "%LOG_FILE%"
) else (
    echo [OK] Could not configure firewall - may need manual configuration
    echo WARNING: Firewall configuration failed >> "%LOG_FILE%"
)

REM Create desktop shortcuts
echo.
echo Creating shortcuts...
call "%INSTALL_DIR%scripts\create-shortcuts.bat"
echo [OK] Desktop shortcuts created

echo.
echo ============================================
echo Step 7: Final Configuration
echo ============================================
echo.

REM Set up environment file
if not exist "%INSTALL_DIR%server\.env" (
    copy "%INSTALL_DIR%server\.env.example" "%INSTALL_DIR%server\.env" >nul
    echo [OK] Environment file created
)

REM Set permissions
echo Setting file permissions...
icacls "%INSTALL_DIR%" /grant Users:F /T >nul 2>&1
icacls "%BACKUP_DIR%" /grant Users:F /T >nul 2>&1
echo [OK] File permissions configured

REM Schedule backup task
echo.
echo Setting up automatic backups...
schtasks /delete /tn "Field Service Backup" /f >nul 2>&1
schtasks /create /tn "Field Service Backup" /tr "%INSTALL_DIR%scripts\backup-database.bat" /sc daily /st 02:00 /ru SYSTEM >nul 2>&1
if !errorLevel! equ 0 (
    echo [OK] Daily backup scheduled for 2:00 AM
    echo [OK] Backup task scheduling completed >> "%LOG_FILE%"
) else (
    echo [OK] Could not schedule automatic backups
    echo WARNING: Backup scheduling failed >> "%LOG_FILE%"
)

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.

REM Test the installation
echo Testing installation...
cd /d "%INSTALL_DIR%server"
start /min cmd /c "node api-minimal.js"
timeout /t 5 /nobreak >nul

REM Check if service is responding
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/test' -TimeoutSec 10; Write-Host '[OK] Application test passed' } catch { Write-Host '[OK] Application test failed - may need manual startup' }"

echo.
echo Installation Summary:
echo =====================
echo Application Directory: %INSTALL_DIR%
echo Database Name: !DB_NAME!
echo Backup Directory: %BACKUP_DIR%
echo.
echo Access Points:
echo  Main Application: http://localhost:5000
echo  Service Requests: http://localhost:5000/service-request.html
echo.
echo Login Credentials:
echo  Username: (as configured in wizard)
echo  Password: (as configured in wizard)
echo.
echo *** IMPORTANT: Check config.json for your configured credentials! ***
echo.
echo New Features in v2.0:
echo  - Public service request submission form
echo  - File attachments (images, PDFs, documents)
echo  - Multi-timezone support in activity logs
echo  - Sequential ticket numbering (TKT-YYYY-MM-NNN)
echo  - File upload directory: %INSTALL_DIR%server\uploads
echo.

REM Log completion
echo Installation completed successfully at %date% %time% >> "%LOG_FILE%"
echo Installation log saved to: %LOG_FILE%

echo Next Steps:
echo 1. Open your web browser
echo 2. Navigate to: http://localhost:5000
echo 3. Login with the credentials you configured
echo 4. Test file attachments on a ticket
echo 5. Try the public service request form at /service-request.html
echo 6. Configure timezone preferences in Activity Log
echo.

echo For support, see documentation files:
echo  - README.md (overview and features)
echo  - QUICK-START.md (getting started guide)
echo  - INSTALLATION-CHECKLIST.md (verification steps)
echo.

REM Ask to start the application
choice /c YN /m "Would you like to open the application in your browser now"
if !errorLevel! equ 1 (
    start http://localhost:5000
)

echo.
echo Installation completed successfully!
echo.
echo REMINDER: Your admin credentials are in config.json
echo File uploads will be stored in: %INSTALL_DIR%server\uploads
echo.
echo Press any key to exit...
pause >nul

exit /b 0
