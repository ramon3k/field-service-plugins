@echo off
REM ================================================================
REM Quick Azure Deployment Script
REM ================================================================

setlocal EnableDelayedExpansion

echo ========================================
echo Deploying to Azure
echo ========================================
echo.

set RESOURCE_GROUP=customer-portal_group
set LOCATION=centralus
set APP_SERVICE_PLAN=field-service-plan
set API_APP_NAME=field-service-api
set FRONTEND_APP_NAME=field-service-app

REM ================================================================
REM STEP 1: Create App Service Plan
REM ================================================================
echo [1/8] Creating App Service Plan...
az appservice plan create ^
  --name %APP_SERVICE_PLAN% ^
  --resource-group %RESOURCE_GROUP% ^
  --location %LOCATION% ^
  --sku B1 ^
  --is-linux >nul 2>&1

if errorlevel 1 (
  echo     - Plan already exists, continuing...
) else (
  echo     - Created successfully
)

REM ================================================================
REM STEP 2: Create API Web App
REM ================================================================
echo [2/8] Creating API Web App...
az webapp create ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --plan %APP_SERVICE_PLAN% ^
  --runtime "NODE:18-lts" >nul 2>&1

if errorlevel 1 (
  echo     - App already exists, continuing...
) else (
  echo     - Created successfully
)

REM ================================================================
REM STEP 3: Configure API Settings
REM ================================================================
echo [3/8] Configuring API environment...
az webapp config appsettings set ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --settings ^
    DB_SERVER=customer-portal-sql-server.database.windows.net ^
    DB_NAME=FieldServiceDB ^
    DB_USER=sqladmin ^
    DB_PASSWORD=CustomerPortal2025! ^
    DB_AUTH=sql ^
    PORT=8080 ^
    NODE_ENV=production ^
    SCM_DO_BUILD_DURING_DEPLOYMENT=true >nul

echo     - Environment configured

REM ================================================================
REM STEP 4: Enable CORS for API
REM ================================================================
echo [4/8] Enabling CORS...
az webapp cors add ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --allowed-origins "*" >nul 2>&1

echo     - CORS enabled

REM ================================================================
REM STEP 5: Package and Deploy API
REM ================================================================
echo [5/8] Packaging API...

REM Create temporary deployment folder
if exist deploy-temp rmdir /s /q deploy-temp
mkdir deploy-temp

REM Copy necessary files
xcopy /s /q server deploy-temp\server\
xcopy /s /q node_modules deploy-temp\node_modules\
copy package.json deploy-temp\
copy api-package.json deploy-temp\package-api.json

echo     - Files packaged

echo [6/8] Deploying API to Azure...
cd deploy-temp
call az webapp up ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --runtime "NODE:18-lts" ^
  --os-type Linux

cd ..
rmdir /s /q deploy-temp

echo     - API deployed

REM ================================================================
REM STEP 6: Build Frontend
REM ================================================================
echo [7/8] Building frontend...
call npm run build

if errorlevel 1 (
  echo     - Build failed!
  pause
  exit /b 1
)

echo     - Frontend built

REM ================================================================
REM STEP 7: Deploy Frontend
REM ================================================================
echo [8/8] Deploying frontend...

az staticwebapp create ^
  --name %FRONTEND_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --location %LOCATION% ^
  --source dist ^
  --branch main >nul 2>&1

if errorlevel 1 (
  echo     - Using Web App instead of Static Web App...
  
  az webapp create ^
    --name %FRONTEND_APP_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --plan %APP_SERVICE_PLAN% ^
    --runtime "NODE:18-lts" >nul 2>&1
  
  cd dist
  call az webapp up ^
    --name %FRONTEND_APP_NAME% ^
    --resource-group %RESOURCE_GROUP% ^
    --html
  cd ..
)

echo     - Frontend deployed

REM ================================================================
REM DONE
REM ================================================================
echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo API URL: https://%API_APP_NAME%.azurewebsites.net
echo Frontend URL: https://%FRONTEND_APP_NAME%.azurewebsites.net
echo.
echo NEXT STEPS:
echo 1. Update .env file with: VITE_API_URL=https://%API_APP_NAME%.azurewebsites.net
echo 2. Rebuild frontend: npm run build
echo 3. Redeploy frontend with updated API URL
echo.
echo ========================================

pause
