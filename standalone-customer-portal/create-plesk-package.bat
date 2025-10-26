@echo off
REM Plesk Deployment Package Creator for Customer Portal
cls

echo ==================================
echo Customer Portal - Plesk Deployment
echo ==================================
echo.

REM Check if we're in the right directory
if not exist "server.js" (
    echo ERROR: This script must be run from the standalone-customer-portal directory
    pause
    exit /b 1
)

if not exist "package.json" (
    echo ERROR: package.json not found. Are you in the right directory?
    pause
    exit /b 1
)

echo Step 1: Creating deployment package...
echo.

REM Create deployment directory
set "DEPLOY_DIR=plesk-deployment"
if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"

REM Copy necessary files
echo Copying files...
copy server.js "%DEPLOY_DIR%\" >nul
copy package.json "%DEPLOY_DIR%\" >nul
xcopy /E /I /Q public "%DEPLOY_DIR%\public\" >nul

REM Create production .env
echo Creating production .env file...
(
echo # ===== PLESK DEPLOYMENT CONFIGURATION =====
echo # UPDATE THESE VALUES FOR YOUR SERVER
echo.
echo # Database Settings ^(REQUIRED - Update these!^)
echo DB_SERVER=YOUR_SQL_SERVER_IP_OR_HOSTNAME
echo DB_NAME=FieldServiceDB
echo DB_USER=portal_user
echo DB_PASSWORD=CHANGE_THIS_PASSWORD
echo.
echo # Company Code ^(REQUIRED^)
echo COMPANY_CODE=KIT
echo.
echo # Server Port ^(Leave as 3000 for Plesk^)
echo PORT=3000
echo.
echo # CORS Settings ^(REQUIRED - Update to your domain!^)
echo ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
echo.
echo # Environment
echo NODE_ENV=production
) > "%DEPLOY_DIR%\.env"

REM Create deployment instructions
echo Creating deployment instructions...
(
echo PLESK DEPLOYMENT INSTRUCTIONS
echo ==============================
echo.
echo 1. UPLOAD FILES
echo    - Zip this entire folder
echo    - Upload to your Plesk server via File Manager
echo    - Extract to: /httpdocs/support/ or /httpdocs/
echo.
echo 2. EDIT .env FILE
echo    - In Plesk File Manager, edit the .env file
echo    - Update DB_SERVER with your SQL Server IP or hostname
echo    - Update DB_USER and DB_PASSWORD with database credentials
echo    - Update ALLOWED_ORIGINS with your actual domain
echo    - Update COMPANY_CODE if different from KIT
echo.
echo 3. CONFIGURE NODE.JS IN PLESK
echo    - Go to: Domains  Your Domain  Node.js
echo    - Click "Enable Node.js"
echo    - Set Application startup file: server.js
echo    - Set Node.js version: 18.x or higher
echo    - Set Application mode: Production
echo    - Click "NPM Install" to install dependencies
echo.
echo 4. SET UP DATABASE USER ^(Run this SQL on your SQL Server^)
echo.
echo    CREATE LOGIN portal_user WITH PASSWORD = 'YourPasswordHere';
echo    USE FieldServiceDB;
echo    CREATE USER portal_user FOR LOGIN portal_user;
echo    GRANT INSERT ON ServiceRequests TO portal_user;
echo    GRANT INSERT ON ActivityLog TO portal_user;
echo    GRANT SELECT ON Users TO portal_user;
echo.
echo 5. CONFIGURE SQL SERVER FOR REMOTE ACCESS
echo    - Enable TCP/IP in SQL Server Configuration Manager
echo    - Set SQL Server to listen on port 1433
echo    - Add firewall rule to allow port 1433
echo    - Enable SQL Server Authentication
echo    - Restart SQL Server service
echo.
echo 6. START APPLICATION
echo    - In Plesk Node.js panel, click "Restart App"
echo    - Check logs for any errors: Domains  Node.js  Logs
echo.
echo 7. TEST YOUR PORTAL
echo    - Visit: https://yourdomain.com/support
echo    - Fill out and submit a test request
echo    - Verify it appears in your Field Service Management System
echo.
echo TROUBLESHOOTING
echo ---------------
echo - Check Plesk logs: Domains  Node.js  Logs
echo - Verify SQL Server allows remote connections
echo - Test database connection from Plesk server
echo - Ensure ALLOWED_ORIGINS matches your domain exactly
echo - Check that SQL Server firewall allows port 1433
echo.
echo For detailed instructions, see:
echo - PLESK-DEPLOYMENT.md in the main portal folder
echo - README-DEPLOYMENT.md for other hosting options
) > "%DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt"

REM Create SQL setup script
echo Creating SQL setup script...
(
echo -- SQL Server Setup Script for Customer Portal
echo -- Run this on your SQL Server to create the portal user
echo.
echo -- Replace 'YourPasswordHere' with a strong password
echo CREATE LOGIN portal_user WITH PASSWORD = 'YourPasswordHere';
echo GO
echo.
echo USE FieldServiceDB;
echo GO
echo.
echo CREATE USER portal_user FOR LOGIN portal_user;
echo GO
echo.
echo -- Grant minimum required permissions
echo GRANT INSERT ON ServiceRequests TO portal_user;
echo GRANT INSERT ON ActivityLog TO portal_user;
echo GRANT SELECT ON Users TO portal_user;
echo GO
echo.
echo -- Verify permissions
echo SELECT 
echo     USER_NAME^(^) AS DatabaseUser,
echo     @@SERVERNAME AS ServerName,
echo     DB_NAME^(^) AS DatabaseName
echo GO
echo.
echo PRINT 'Portal user created successfully!'
echo PRINT 'Username: portal_user'
echo PRINT 'Password: [the password you set above]'
) > "%DEPLOY_DIR%\setup-database-user.sql"

echo.
echo ========================================
echo SUCCESS! Deployment package created
echo ========================================
echo.
echo Package location: %DEPLOY_DIR%\
echo.
dir "%DEPLOY_DIR%" /w
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. EDIT: %DEPLOY_DIR%\.env
echo    - Update database connection details
echo    - Update your domain for CORS
echo.
echo 2. CREATE ZIP FILE
echo    - Right-click %DEPLOY_DIR% folder
echo    - Select "Send to" -^> "Compressed (zipped) folder"
echo.
echo 3. UPLOAD TO PLESK
echo    - Log into your Plesk panel
echo    - Go to File Manager
echo    - Upload the zip file
echo    - Extract it
echo.
echo 4. FOLLOW: %DEPLOY_DIR%\DEPLOYMENT-INSTRUCTIONS.txt
echo.
echo ========================================
echo.
echo For detailed deployment guide, see:
echo PLESK-DEPLOYMENT.md in the main folder
echo.
pause
