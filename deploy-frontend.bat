@echo off
echo ========================================
echo Deploying Frontend to Azure Static Web Apps
echo ========================================
echo.

REM Check if environment variables are set
if "%VITE_CLIENT_ID%"=="" (
  echo ERROR: VITE_CLIENT_ID environment variable not set
  echo Please set your Azure credentials as environment variables
  pause
  exit /b 1
)

REM Update .env to point to Azure API
echo Updating API URL in .env...
echo VITE_CLIENT_ID=%VITE_CLIENT_ID% > .env.production
echo VITE_TENANT_ID=%VITE_TENANT_ID% >> .env.production
echo VITE_SHAREPOINT_SITE_URL=%VITE_SHAREPOINT_SITE_URL% >> .env.production
echo VITE_API_URL=%VITE_API_URL% >> .env.production

echo Building frontend...
call npm run build

if errorlevel 1 (
  echo Build failed!
  pause
  exit /b 1
)

echo.
echo Deploying to Azure Static Web Apps...
if "%AZURE_STATIC_WEB_APPS_DEPLOYMENT_TOKEN%"=="" (
  echo ERROR: AZURE_STATIC_WEB_APPS_DEPLOYMENT_TOKEN not set
  pause
  exit /b 1
)

call npx @azure/static-web-apps-cli deploy ^
  --app-location . ^
  --output-location dist ^
  --deployment-token %AZURE_STATIC_WEB_APPS_DEPLOYMENT_TOKEN%

echo.
echo ========================================
echo Frontend Deployment Complete!
echo ========================================
echo Check Azure portal for your Static Web App URL
echo ========================================

pause
