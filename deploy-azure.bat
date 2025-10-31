@echo off
title Azure Deployment - Field Service SaaS API

echo.
echo ================================================
echo   🚀 DCPSP Field Service - Azure Deployment
echo ================================================
echo.

REM Configuration
set RESOURCE_GROUP=field-service-rg
set APP_SERVICE_PLAN=field-service-plan
set LOCATION=eastus
set RUNTIME=node^|18-lts

REM Generate unique web app name
for /f %%i in ('powershell -Command "Get-Date -Format 'yyyyMMddHHmmss'"') do set TIMESTAMP=%%i
set WEB_APP_NAME=field-service-api-%TIMESTAMP%

echo Resource Group: %RESOURCE_GROUP%
echo App Service Plan: %APP_SERVICE_PLAN%
echo Web App Name: %WEB_APP_NAME%
echo Location: %LOCATION%
echo.

REM Check if Azure CLI is installed
az --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Azure CLI is not installed. 
    echo.
    echo Please install Azure CLI from:
    echo https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
    echo.
    pause
    exit /b 1
)

echo ✅ Azure CLI detected
echo.

REM Login to Azure
echo 🔐 Logging into Azure...
call az login
if errorlevel 1 (
    echo ❌ Azure login failed
    pause
    exit /b 1
)

REM Create resource group
echo.
echo 📦 Creating resource group: %RESOURCE_GROUP%
call az group create --name %RESOURCE_GROUP% --location %LOCATION%

REM Create App Service plan
echo.
echo ⚡ Creating App Service plan: %APP_SERVICE_PLAN%
call az appservice plan create --name %APP_SERVICE_PLAN% --resource-group %RESOURCE_GROUP% --sku B1 --is-linux

REM Create Web App
echo.
echo 🌐 Creating Web App: %WEB_APP_NAME%
call az webapp create --resource-group %RESOURCE_GROUP% --plan %APP_SERVICE_PLAN% --name %WEB_APP_NAME% --runtime "%RUNTIME%"

REM Generate JWT secret
for /f %%i in ('powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32,8)"') do set JWT_SECRET=%%i

REM Configure app settings
echo.
echo ⚙️  Configuring application settings...
call az webapp config appsettings set --resource-group %RESOURCE_GROUP% --name %WEB_APP_NAME% --settings NODE_ENV=production JWT_SECRET=%JWT_SECRET% PORT=8000 WEBSITE_NODE_DEFAULT_VERSION=18.18.0

REM Enable HTTPS redirect
echo.
echo 🔒 Enabling HTTPS redirect...
call az webapp update --resource-group %RESOURCE_GROUP% --name %WEB_APP_NAME% --https-only true

REM Build and prepare deployment package
echo.
echo 📦 Building deployment package...

echo    Building React frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo    Preparing server files...
if exist deploy-package rmdir /s /q deploy-package
mkdir deploy-package
xcopy server\* deploy-package\ /s /e /q
xcopy dist\* deploy-package\public\ /s /e /q
copy package*.json deploy-package\

REM Install production dependencies
echo    Installing production dependencies...
cd deploy-package
call npm ci --production
if errorlevel 1 (
    echo ❌ Dependencies installation failed
    cd ..
    pause
    exit /b 1
)
cd ..

REM Create deployment zip
echo    Creating deployment package...
powershell -Command "Compress-Archive -Path deploy-package\* -DestinationPath deployment.zip -Force"

REM Deploy to Azure
echo.
echo 🚀 Deploying to Azure...
call az webapp deployment source config-zip --resource-group %RESOURCE_GROUP% --name %WEB_APP_NAME% --src deployment.zip

REM Get the app URL
for /f %%i in ('az webapp show --resource-group %RESOURCE_GROUP% --name %WEB_APP_NAME% --query "defaultHostName" -o tsv') do set APP_URL=%%i

echo.
echo ================================================
echo   ✅ Deployment completed successfully!
echo ================================================
echo.
echo 🌐 Your API is now live at:
echo    https://%APP_URL%
echo.
echo 📡 API endpoints:
echo    https://%APP_URL%/api/health
echo    https://%APP_URL%/api/tenant/register
echo    https://%APP_URL%/api/auth/login
echo.
echo 🎯 Next steps:
echo    1. Update your React app's API base URL to: https://%APP_URL%/api
echo    2. Configure custom domain (optional)
echo    3. Set up monitoring and alerts
echo    4. Test tenant registration and login
echo.
echo 💡 Resource details:
echo    Resource Group: %RESOURCE_GROUP%
echo    App Service: %WEB_APP_NAME%
echo    Plan: %APP_SERVICE_PLAN%
echo    JWT Secret: %JWT_SECRET%
echo.

REM Cleanup
echo 🧹 Cleaning up temporary files...
if exist deploy-package rmdir /s /q deploy-package
if exist deployment.zip del deployment.zip

echo.
echo ⚡ Your multi-tenant SaaS API is ready for customers!
echo.
echo 🔗 Open in browser? (Y/N)
set /p OPEN_BROWSER=
if /i "%OPEN_BROWSER%"=="Y" start https://%APP_URL%

pause