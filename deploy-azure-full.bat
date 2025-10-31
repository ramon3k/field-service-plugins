@echo off
title Azure Full Deployment - Field Service Multi-Tenant

echo.
echo ========================================================
echo   🚀 Field Service Multi-Tenant - Full Azure Deployment
echo ========================================================
echo.
echo This script will deploy:
echo   📦 Azure SQL Database (single multi-tenant database)
echo   🌐 Azure App Service (API + Frontend)
echo   🔒 Firewall rules for your IP
echo.

REM Configuration
set RESOURCE_GROUP=field-service-rg
set LOCATION=eastus
set SQL_SERVER_NAME=field-service-sql-%RANDOM%%RANDOM%
set SQL_DATABASE_NAME=FieldServiceDB
set SQL_ADMIN_USER=fsadmin
set APP_SERVICE_PLAN=field-service-plan
set WEB_APP_NAME=field-service-app-%RANDOM%%RANDOM%

echo Resource Group: %RESOURCE_GROUP%
echo SQL Server: %SQL_SERVER_NAME%
echo Database: %SQL_DATABASE_NAME%
echo Web App: %WEB_APP_NAME%
echo Location: %LOCATION%
echo.

REM Check Azure CLI
az --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Azure CLI not installed
    echo Install from: https://aka.ms/installazurecliwindows
    pause
    exit /b 1
)

echo ✅ Azure CLI detected
echo.

REM Get SQL password
echo 🔐 Set SQL Server Admin Password:
set /p SQL_ADMIN_PASSWORD="Enter password (min 8 chars, uppercase, lowercase, number, special char): "
if "%SQL_ADMIN_PASSWORD%"=="" (
    echo ❌ Password cannot be empty
    pause
    exit /b 1
)

REM Login to Azure
echo.
echo 🔐 Logging into Azure...
call az login
if errorlevel 1 (
    echo ❌ Azure login failed
    pause
    exit /b 1
)

REM Create resource group
echo.
echo 📦 Creating resource group...
call az group create --name %RESOURCE_GROUP% --location %LOCATION%

REM Create SQL Server
echo.
echo 🗄️  Creating Azure SQL Server: %SQL_SERVER_NAME%
call az sql server create ^
    --name %SQL_SERVER_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --location %LOCATION% ^
    --admin-user %SQL_ADMIN_USER% ^
    --admin-password %SQL_ADMIN_PASSWORD%

REM Get your IP address
for /f %%i in ('powershell -Command "(Invoke-WebRequest -Uri 'https://api.ipify.org').Content"') do set MY_IP=%%i
echo Your IP: %MY_IP%

REM Add firewall rule for your IP
echo.
echo 🔥 Adding firewall rule for your IP...
call az sql server firewall-rule create ^
    --resource-group %RESOURCE_GROUP% ^
    --server %SQL_SERVER_NAME% ^
    --name AllowMyIP ^
    --start-ip-address %MY_IP% ^
    --end-ip-address %MY_IP%

REM Allow Azure services
echo.
echo 🔥 Allowing Azure services...
call az sql server firewall-rule create ^
    --resource-group %RESOURCE_GROUP% ^
    --server %SQL_SERVER_NAME% ^
    --name AllowAzureServices ^
    --start-ip-address 0.0.0.0 ^
    --end-ip-address 0.0.0.0

REM Create SQL Database
echo.
echo 💾 Creating SQL Database: %SQL_DATABASE_NAME%
call az sql db create ^
    --resource-group %RESOURCE_GROUP% ^
    --server %SQL_SERVER_NAME% ^
    --name %SQL_DATABASE_NAME% ^
    --service-objective S0 ^
    --backup-storage-redundancy Local

REM Get SQL connection details
for /f %%i in ('az sql server show --resource-group %RESOURCE_GROUP% --name %SQL_SERVER_NAME% --query "fullyQualifiedDomainName" -o tsv') do set SQL_FQDN=%%i

echo.
echo ✅ SQL Server created: %SQL_FQDN%
echo.
echo 📋 SQL Connection String:
echo Server=tcp:%SQL_FQDN%,1433;Initial Catalog=%SQL_DATABASE_NAME%;User ID=%SQL_ADMIN_USER%;Password=%SQL_ADMIN_PASSWORD%;Encrypt=true;TrustServerCertificate=false;
echo.

REM Prompt to import database schema
echo.
echo 📊 Next, we need to create the database schema in Azure SQL.
echo.
echo Options:
echo   1. Use SQL Server Management Studio (SSMS) to connect and run scripts
echo   2. Use sqlcmd to execute schema scripts
echo   3. Restore from a backup
echo.
echo Connection details for SSMS:
echo   Server: %SQL_FQDN%
echo   Authentication: SQL Server Authentication
echo   Login: %SQL_ADMIN_USER%
echo   Password: %SQL_ADMIN_PASSWORD%
echo   Database: %SQL_DATABASE_NAME%
echo.
echo 💡 You'll need to:
echo   1. Create tables (Users, Tickets, Companies, etc.)
echo   2. Insert your DCPSP and JBI company records
echo   3. Create admin users for both companies
echo.
set /p DB_READY="Have you set up the database schema? (Y/N): "
if /i not "%DB_READY%"=="Y" (
    echo.
    echo ⏸️  Deployment paused. Set up the database schema first.
    echo After setup, run this script again or continue manually.
    echo.
    echo SQL Server: %SQL_FQDN%
    echo Database: %SQL_DATABASE_NAME%
    echo Username: %SQL_ADMIN_USER%
    pause
    exit /b 0
)

REM Create App Service Plan
echo.
echo ⚡ Creating App Service Plan...
call az appservice plan create ^
    --name %APP_SERVICE_PLAN% ^
    --resource-group %RESOURCE_GROUP% ^
    --sku B1 ^
    --is-linux

REM Create Web App
echo.
echo 🌐 Creating Web App: %WEB_APP_NAME%
call az webapp create ^
    --resource-group %RESOURCE_GROUP% ^
    --plan %APP_SERVICE_PLAN% ^
    --name %WEB_APP_NAME% ^
    --runtime "NODE:18-lts"

REM Generate JWT secret
for /f %%i in ('powershell -Command "[guid]::NewGuid().ToString()"') do set JWT_SECRET=%%i

REM Configure app settings
echo.
echo ⚙️  Configuring application settings...
call az webapp config appsettings set ^
    --resource-group %RESOURCE_GROUP% ^
    --name %WEB_APP_NAME% ^
    --settings ^
    NODE_ENV=production ^
    PORT=8080 ^
    JWT_SECRET=%JWT_SECRET% ^
    DB_SERVER=%SQL_FQDN% ^
    DB_NAME=%SQL_DATABASE_NAME% ^
    DB_USER=%SQL_ADMIN_USER% ^
    DB_PASSWORD=%SQL_ADMIN_PASSWORD% ^
    DB_ENCRYPT=true

REM Enable HTTPS
echo.
echo 🔒 Enabling HTTPS...
call az webapp update ^
    --resource-group %RESOURCE_GROUP% ^
    --name %WEB_APP_NAME% ^
    --https-only true

REM Build application
echo.
echo 📦 Building application...
echo    Building React frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo    Preparing deployment package...
if exist deploy-package rmdir /s /q deploy-package
mkdir deploy-package
mkdir deploy-package\public

REM Copy server files
xcopy server\*.cjs deploy-package\ /q /y
xcopy server\*.js deploy-package\ /q /y
if exist server\.env.example copy server\.env.example deploy-package\ >nul

REM Copy frontend build
xcopy dist\* deploy-package\public\ /s /e /q /y

REM Copy package files
copy package.json deploy-package\ >nul
copy package-lock.json deploy-package\ >nul

REM Create startup script
echo.
echo 📝 Creating startup script...
echo const path = require('path'); > deploy-package\server.js
echo const api = require('./api.cjs'); >> deploy-package\server.js

REM Install production dependencies
echo.
echo 📦 Installing production dependencies...
cd deploy-package
call npm ci --omit=dev
if errorlevel 1 (
    echo ❌ Dependencies installation failed
    cd ..
    pause
    exit /b 1
)
cd ..

REM Create deployment zip
echo.
echo 📦 Creating deployment package...
powershell -Command "Compress-Archive -Path deploy-package\* -DestinationPath deployment.zip -Force"

REM Deploy to Azure
echo.
echo 🚀 Deploying to Azure Web App...
call az webapp deployment source config-zip ^
    --resource-group %RESOURCE_GROUP% ^
    --name %WEB_APP_NAME% ^
    --src deployment.zip

REM Get app URL
for /f %%i in ('az webapp show --resource-group %RESOURCE_GROUP% --name %WEB_APP_NAME% --query "defaultHostName" -o tsv') do set APP_URL=%%i

REM Restart app
echo.
echo 🔄 Restarting web app...
call az webapp restart --resource-group %RESOURCE_GROUP% --name %WEB_APP_NAME%

echo.
echo ========================================================
echo   ✅ Deployment Completed Successfully!
echo ========================================================
echo.
echo 🌐 Application URL:
echo    https://%APP_URL%
echo.
echo 🗄️  SQL Server:
echo    Server: %SQL_FQDN%
echo    Database: %SQL_DATABASE_NAME%
echo    Username: %SQL_ADMIN_USER%
echo.
echo 📡 API Endpoints:
echo    https://%APP_URL%/api/health
echo    https://%APP_URL%/api/auth/login
echo.
echo 🎯 Test Login:
echo    Company Code: DCPSP or JBI
echo    Username: admin
echo    Password: [your admin password]
echo.
echo 💡 Next Steps:
echo    1. Test the login at https://%APP_URL%
echo    2. Verify data isolation between companies
echo    3. Set up custom domain (optional)
echo    4. Configure monitoring and alerts
echo.
echo 📋 Deployment Info (save this!):
echo    Resource Group: %RESOURCE_GROUP%
echo    SQL Server: %SQL_SERVER_NAME%
echo    Web App: %WEB_APP_NAME%
echo    Location: %LOCATION%
echo.

REM Save deployment info
echo Deployment Info > deployment-info.txt
echo ================= >> deployment-info.txt
echo Date: %DATE% %TIME% >> deployment-info.txt
echo Resource Group: %RESOURCE_GROUP% >> deployment-info.txt
echo SQL Server: %SQL_FQDN% >> deployment-info.txt
echo Database: %SQL_DATABASE_NAME% >> deployment-info.txt
echo SQL User: %SQL_ADMIN_USER% >> deployment-info.txt
echo Web App: https://%APP_URL% >> deployment-info.txt
echo JWT Secret: %JWT_SECRET% >> deployment-info.txt
echo ================= >> deployment-info.txt

echo.
echo 💾 Deployment info saved to: deployment-info.txt
echo.

REM Cleanup
echo 🧹 Cleaning up temporary files...
if exist deploy-package rmdir /s /q deploy-package
if exist deployment.zip del deployment.zip

echo.
echo 🔗 Open application in browser? (Y/N)
set /p OPEN_BROWSER=
if /i "%OPEN_BROWSER%"=="Y" start https://%APP_URL%

echo.
echo 🎉 Your Field Service application is now live in Azure!
echo.
pause
