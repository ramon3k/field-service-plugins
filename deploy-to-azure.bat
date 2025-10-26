@echo off
REM ================================================================
REM Deploy Field Service App to Azure
REM ================================================================

echo ========================================
echo Deploying Field Service App to Azure
echo ========================================
echo.

REM Configuration
set RESOURCE_GROUP=customer-portal_group
set LOCATION=centralus
set APP_SERVICE_PLAN=field-service-plan
set API_APP_NAME=field-service-api
set FRONTEND_APP_NAME=field-service-app
set SQL_SERVER=customer-portal-sql-server.database.windows.net
set SQL_DATABASE=FieldServiceDB
set SQL_USER=sqladmin
set SQL_PASSWORD=CustomerPortal2025!

echo Step 1: Creating App Service Plan...
call az appservice plan create ^
  --name %APP_SERVICE_PLAN% ^
  --resource-group %RESOURCE_GROUP% ^
  --location %LOCATION% ^
  --sku B1 ^
  --is-linux

if errorlevel 1 (
  echo App Service Plan might already exist, continuing...
)

echo.
echo Step 2: Creating API Web App...
call az webapp create ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --plan %APP_SERVICE_PLAN% ^
  --runtime "NODE:18-lts"

if errorlevel 1 (
  echo API Web App might already exist, continuing...
)

echo.
echo Step 3: Configuring API environment variables...
call az webapp config appsettings set ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --settings ^
    DB_SERVER=%SQL_SERVER% ^
    DB_NAME=%SQL_DATABASE% ^
    DB_USER=%SQL_USER% ^
    DB_PASSWORD=%SQL_PASSWORD% ^
    DB_AUTH=sql ^
    PORT=8080 ^
    NODE_ENV=production

echo.
echo Step 4: Configuring API startup command...
call az webapp config set ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --startup-file "node server/api.cjs"

echo.
echo Step 5: Building frontend for production...
call npm run build

if errorlevel 1 (
  echo Frontend build failed!
  pause
  exit /b 1
)

echo.
echo Step 6: Creating Frontend Web App...
call az webapp create ^
  --name %FRONTEND_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --plan %APP_SERVICE_PLAN% ^
  --runtime "NODE:18-lts"

if errorlevel 1 (
  echo Frontend Web App might already exist, continuing...
)

echo.
echo Step 7: Deploying API to Azure...
cd /d "%~dp0"
call az webapp deploy ^
  --name %API_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --src-path . ^
  --type zip ^
  --async true

echo.
echo Step 8: Deploying Frontend to Azure...
call az webapp deploy ^
  --name %FRONTEND_APP_NAME% ^
  --resource-group %RESOURCE_GROUP% ^
  --src-path dist ^
  --type static ^
  --async true

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo API URL: https://%API_APP_NAME%.azurewebsites.net
echo Frontend URL: https://%FRONTEND_APP_NAME%.azurewebsites.net
echo.
echo Update your frontend .env to use:
echo VITE_API_URL=https://%API_APP_NAME%.azurewebsites.net
echo.
echo Then rebuild and redeploy frontend if needed.
echo ========================================

pause
