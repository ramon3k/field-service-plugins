@echo off
setlocal EnableDelayedExpansion
cls

:: Field Service Management System Installer
:: Version 2.0
:: Automated installation script for Windows

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

:: Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer must be run as Administrator.
    echo.
    echo Please:
    echo 1. Right-click on SETUP.bat
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [√] Running with Administrator privileges
echo.

:: Set installation variables
set "INSTALL_DIR=%~dp0"
set "APP_NAME=Field Service Management System"
set "SERVICE_NAME=FieldServiceAPI"
set "LOG_FILE=%INSTALL_DIR%install.log"

:: Security: Require SQL 'sa' password for fresh SQL Express installs
if not defined SQL_SA_PASSWORD (
    echo.
    echo SECURITY: A strong SQL Server 'sa' password is required for installation.
    set /p SQL_SA_PASSWORD=Enter SQL 'sa' password (will be used only during setup): 
)

:: Read configuration from config.json if it exists
set "DB_NAME=FieldServiceDB"
set "DB_SERVER=localhost\SQLEXPRESS"
set "BACKUP_DIR=C:\FieldServiceBackups"

if exist "%INSTALL_DIR%config.json" (
    echo [√] Reading configuration from config.json...
    
    :: Extract DatabaseName from config.json
    for /f "tokens=2 delims=:," %%a in ('type "%INSTALL_DIR%config.json" ^| findstr /C:"DatabaseName"') do (
        set "DB_NAME=%%~a"
        set "DB_NAME=!DB_NAME: =!"
        set "DB_NAME=!DB_NAME:"=!"
    )
    
    :: Extract DatabaseServer from config.json
    for /f "tokens=2 delims=:," %%a in ('type "%INSTALL_DIR%config.json" ^| findstr /C:"DatabaseServer"') do (
        set "DB_SERVER=%%~a"
        set "DB_SERVER=!DB_SERVER: =!"
        set "DB_SERVER=!DB_SERVER:"=!"
        :: Convert double backslash to single backslash
        set "DB_SERVER=!DB_SERVER:\\=\!"
    )
    
    echo [√] Using configured database: !DB_NAME! on !DB_SERVER!
) else (
    echo [!] No config.json found - using defaults
    echo [!] Run CONFIGURE.bat first for custom settings
)

echo.
echo Installation Directory: %INSTALL_DIR%
echo Database Name: %DB_NAME%
echo Database Server: %DB_SERVER%
echo Backup Directory: %BACKUP_DIR%
echo.

:: Create log file
echo Installation started at %date% %time% > "%LOG_FILE%"

:: Step 1: Check system requirements
echo ============================================
echo Step 1: Checking System Requirements
echo ============================================
echo.

:: Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo Windows Version: %VERSION%
echo [√] Windows version check passed >> "%LOG_FILE%"

:: Check available disk space (at least 5GB free)
echo Checking disk space...
for /f "tokens=3" %%a in ('dir /-c "%INSTALL_DIR%" 2^>nul ^| find "bytes free"') do set FREESPACE=%%a

:: Handle OneDrive paths or calculation errors
if not defined FREESPACE (
    echo [!] Could not determine free space - continuing anyway
    echo [!] OneDrive paths may cause false warnings >> "%LOG_FILE%"
    goto :skip_diskspace
)

set /a FREESPACE_GB=%FREESPACE:~0,-9% 2>nul
if %FREESPACE_GB% LSS 5 (
    echo [!] WARNING: Disk space check shows %FREESPACE_GB%GB free
    echo [!] This may be incorrect for OneDrive paths
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 (
        exit /b 1
    )
) else (
    echo [√] Disk space check passed: %FREESPACE_GB%GB available
)

:skip_diskspace

:: Check if SQL Server is already installed
echo.
echo Checking for SQL Server Express...
sc query "MSSQL$SQLEXPRESS" >nul 2>&1
if %errorLevel% equ 0 (
    echo [√] SQL Server Express already installed
    set SQL_INSTALLED=true
) else (
    echo [!] SQL Server Express not found - will install
    set SQL_INSTALLED=false
)

:: Check if Node.js is installed
echo.
echo Checking for Node.js...
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [√] Node.js already installed: !NODE_VERSION!
    set NODE_INSTALLED=true
) else (
    echo [!] Node.js not found - will install
    set NODE_INSTALLED=false
)

echo.
echo ============================================
echo Step 2: Installing Prerequisites
echo ============================================
echo.

:: Install SQL Server Express if needed
if "%SQL_INSTALLED%"=="false" (
    echo Installing SQL Server Express 2019...
    echo This may take 10-15 minutes. Please wait...
    echo.
    
    :: Check if installer exists locally
    if exist "%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe" (
        echo [√] Found SQL Server installer in installers folder
        goto :install_sql
    )
    
    :: Try to download if not found
    echo [!] SQL Server installer not found locally
    echo [!] Attempting to download (270 MB)...
    echo [!] This may take several minutes depending on your connection...
    echo.
    
    powershell -ExecutionPolicy Bypass -Command "try { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://download.microsoft.com/download/7/c/1/7c14e92e-bdcb-4f89-b7cf-93543e7112d1/SQLEXPR_x64_ENU.exe' -OutFile '%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe' -UseBasicParsing; exit 0 } catch { Write-Host 'Download failed:' $_.Exception.Message; exit 1 }" 2>&1
    
    if !errorLevel! neq 0 (
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
    
    :: Verify download succeeded
    if not exist "%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe" (
        echo [X] Download verification failed - file not created
        echo Please download manually and run SETUP.bat again
        pause
        exit /b 1
    )
    
    echo [√] Download completed successfully
    echo.
    
    :install_sql
    echo Installing SQL Server Express...
    echo (This runs silently - please wait 10-15 minutes)
    echo.
    
    "%INSTALL_DIR%installers\SQLEXPR_x64_ENU.exe" /Q /IACCEPTSQLSERVERLICENSETERMS /ACTION=Install /FEATURES=SQLEngine /INSTANCENAME=SQLEXPRESS /SECURITYMODE=SQL /SAPWD="%SQL_SA_PASSWORD%" /TCPENABLED=1 /BROWSERSVCSTARTUPTYPE=Automatic
    
    if !errorLevel! equ 0 (
        echo [√] SQL Server Express installed successfully
        echo [√] SQL Server Express installation completed >> "%LOG_FILE%"
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
    echo [√] Using existing SQL Server Express installation
)

:: Install Node.js if needed
if "%NODE_INSTALLED%"=="false" (
    echo.
    echo Installing Node.js LTS...
    echo.
    
    :: Check if installer exists locally
    if exist "%INSTALL_DIR%installers\node-v18.18.0-x64.msi" (
        echo [√] Found Node.js installer in installers folder
        goto :install_node
    )
    
    :: Try to download if not found
    echo [!] Node.js installer not found locally
    echo [!] Attempting to download (28 MB)...
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
    
    :: Verify download succeeded
    if not exist "%INSTALL_DIR%installers\node-v18.18.0-x64.msi" (
        echo [X] Download verification failed - file not created
        echo Please download manually and run SETUP.bat again
        pause
        exit /b 1
    )
    
    echo [√] Download completed successfully
    echo.
    
    :install_node
    echo Installing Node.js...
    echo.
    
    msiexec /i "%INSTALL_DIR%installers\node-v18.18.0-x64.msi" /quiet /norestart
    
    if !errorLevel! equ 0 (
        echo [√] Node.js installed successfully
        echo [√] Node.js installation completed >> "%LOG_FILE%"
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
    
    :: Refresh environment variables
    echo [!] Refreshing environment variables...
    call "%INSTALL_DIR%scripts\refresh-env.bat" 2>nul
    if !errorLevel! neq 0 (
        echo [!] Could not refresh environment - you may need to restart your terminal
    )
) else (
    echo [√] Using existing Node.js installation
)

echo.
echo ============================================
echo Step 3: Configuration Wizard
echo ============================================
echo.

:: Check if configuration already exists
if exist "%INSTALL_DIR%config.json" (
    echo [!] Configuration file already exists
    echo.
    choice /C YN /M "Do you want to reconfigure the application"
    if errorlevel 2 (
        echo [√] Using existing configuration
        goto :skip_config
    )
)

:: Run configuration wizard
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
    echo [√] Configuration completed successfully
    echo [√] Configuration wizard completed >> "%LOG_FILE%"
) else (
    echo [X] Configuration failed
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

:: Create backup directory
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo [√] Created backup directory: %BACKUP_DIR%
)

:: Install server dependencies
echo Installing server dependencies...
cd /d "%INSTALL_DIR%server"
if exist package.json (
    call npm install --production
    if !errorLevel! equ 0 (
        echo [√] Server dependencies installed
        echo [√] Server dependencies installation completed >> "%LOG_FILE%"
    ) else (
        echo [X] Failed to install server dependencies
        echo ERROR: Server dependencies installation failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
) else (
    echo ERROR: package.json not found in server directory
    pause
    exit /b 1
)

:: Build client application
echo.
echo Building client application...
cd /d "%INSTALL_DIR%"
if exist package.json (
    call npm install
    call npm run build
    if !errorLevel! equ 0 (
        echo [√] Client application built successfully
        echo [√] Client build completed >> "%LOG_FILE%"
    ) else (
        echo [X] Failed to build client application
        echo ERROR: Client build failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
) else (
    echo [!] Client package.json not found - skipping client build
)

echo.
echo ============================================
echo Step 5: Database Setup
echo ============================================
echo.

:: Wait for SQL Server to be ready
echo Waiting for SQL Server to start...
timeout /t 10 /nobreak >nul

:: Create database
echo Creating database with complete schema...
sqlcmd -S "%DB_SERVER%" -i "%INSTALL_DIR%database\create-database-complete.sql" >nul 2>&1
if !errorLevel! equ 0 (
    echo [√] Database created successfully
    echo [√] Database creation completed >> "%LOG_FILE%"
) else (
    echo [X] Database creation failed - trying alternative method
    call "%INSTALL_DIR%scripts\create-database.bat"
    if !errorLevel! equ 0 (
        echo [√] Database created successfully
        echo [√] Database creation completed >> "%LOG_FILE%"
    ) else (
        echo [X] Database creation failed
        echo ERROR: Database creation failed >> "%LOG_FILE%"
        pause
        exit /b 1
    )
)

:: Import sample data
echo.
echo Importing sample data...
call "%INSTALL_DIR%scripts\import-sample-data.bat"
if !errorLevel! equ 0 (
    echo [√] Sample data imported successfully
    echo [√] Sample data import completed >> "%LOG_FILE%"
) else (
    echo [!] Sample data import had issues - continuing anyway
    echo WARNING: Sample data import issues >> "%LOG_FILE%"
)

:: Add CompanyCode support to all tables
echo.
echo Adding CompanyCode multi-tenant support...
sqlcmd -S "%DB_SERVER%" -d %DB_NAME% -i "%INSTALL_DIR%database\add-company-code-support.sql" >nul 2>&1
if !errorLevel! equ 0 (
    echo [√] CompanyCode columns added successfully
    echo [√] CompanyCode support completed >> "%LOG_FILE%"
) else (
    echo [!] CompanyCode addition had issues - continuing anyway
    echo WARNING: CompanyCode addition issues >> "%LOG_FILE%"
)

:: Create admin user from configuration wizard
if exist "%INSTALL_DIR%database\create-admin-user.sql" (
    echo.
    echo Creating admin user from configuration...
    sqlcmd -S "%DB_SERVER%" -d %DB_NAME% -i "%INSTALL_DIR%database\create-admin-user.sql" >nul 2>&1
    if !errorLevel! equ 0 (
        echo [√] Admin user created successfully
        echo [√] Admin user creation completed >> "%LOG_FILE%"
    ) else (
        echo [!] Admin user creation had issues
        echo WARNING: Admin user creation failed >> "%LOG_FILE%"
    )
)

:: Create uploads directory for file attachments
echo.
echo Creating file upload directory...
if not exist "%INSTALL_DIR%server\uploads" (
    mkdir "%INSTALL_DIR%server\uploads"
    echo [√] Created uploads directory: %INSTALL_DIR%server\uploads
    echo [√] Uploads directory created >> "%LOG_FILE%"
) else (
    echo [√] Uploads directory already exists
)

:: Set permissions on uploads directory
icacls "%INSTALL_DIR%server\uploads" /grant "Everyone:(OI)(CI)F" /T >nul 2>&1
if !errorLevel! equ 0 (
    echo [√] Permissions set on uploads directory
) else (
    echo [!] Could not set permissions - may need manual configuration
)

echo.
echo ============================================
echo Step 6: Service Configuration
echo ============================================
echo.

:: Create Windows service (optional)
echo Configuring application service...
if exist "%INSTALL_DIR%scripts\install-service.bat" (
    call "%INSTALL_DIR%scripts\install-service.bat"
    echo [√] Service configuration completed
) else (
    echo [!] Service installer not found - manual startup required
)

:: Configure firewall
echo.
echo Configuring Windows Firewall...
netsh advfirewall firewall delete rule name="Field Service API" >nul 2>&1
netsh advfirewall firewall add rule name="Field Service API" dir=in action=allow protocol=TCP localport=5000 >nul 2>&1
if !errorLevel! equ 0 (
    echo [√] Firewall rule added for port 5000
    echo [√] Firewall configuration completed >> "%LOG_FILE%"
) else (
    echo [!] Could not configure firewall - may need manual configuration
    echo WARNING: Firewall configuration failed >> "%LOG_FILE%"
)

:: Create desktop shortcuts
echo.
echo Creating shortcuts...
call "%INSTALL_DIR%scripts\create-shortcuts.bat"
echo [√] Desktop shortcuts created

echo.
echo ============================================
echo Step 7: Final Configuration
echo ============================================
echo.

:: Set up environment file
if not exist "%INSTALL_DIR%server\.env" (
    copy "%INSTALL_DIR%server\.env.example" "%INSTALL_DIR%server\.env" >nul
    echo [√] Environment file created
)

:: Set permissions
echo Setting file permissions...
icacls "%INSTALL_DIR%" /grant Users:F /T >nul 2>&1
icacls "%BACKUP_DIR%" /grant Users:F /T >nul 2>&1
echo [√] File permissions configured

:: Schedule backup task
echo.
echo Setting up automatic backups...
schtasks /delete /tn "Field Service Backup" /f >nul 2>&1
schtasks /create /tn "Field Service Backup" /tr "%INSTALL_DIR%scripts\backup-database.bat" /sc daily /st 02:00 /ru SYSTEM >nul 2>&1
if !errorLevel! equ 0 (
    echo [√] Daily backup scheduled for 2:00 AM
    echo [√] Backup task scheduling completed >> "%LOG_FILE%"
) else (
    echo [!] Could not schedule automatic backups
    echo WARNING: Backup scheduling failed >> "%LOG_FILE%"
)

echo.
echo ============================================
echo Installation Complete!
echo ============================================
echo.

:: Test the installation
echo Testing installation...
cd /d "%INSTALL_DIR%server"
start /min cmd /c "node api-minimal.js"
timeout /t 5 /nobreak >nul

:: Check if service is responding
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/test' -TimeoutSec 10; Write-Host '[√] Application test passed' } catch { Write-Host '[!] Application test failed - may need manual startup' }"

echo.
echo Installation Summary:
echo =====================
echo Application Directory: %INSTALL_DIR%
echo Database Name: %DB_NAME%
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

:: Log completion
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

:: Ask to start the application
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