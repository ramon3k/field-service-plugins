@echo off
echo ========================================
echo Deploying Frontend to Azure Static Web Apps
echo ========================================
echo.

REM Update .env to point to Azure API
echo Updating API URL in .env...
echo VITE_CLIENT_ID=9fda3787-3cc5-4e61-940a-1b09914e61ac > .env.production
echo VITE_TENANT_ID=bf8e88aa-6a4a-40a7-a072-9dd95553fcb4 >> .env.production
echo VITE_SHAREPOINT_SITE_URL=https://netorg18831757.sharepoint.com/sites/DataCenterPhysicalSecurityPrep >> .env.production
echo VITE_API_URL=https://field-service-api.azurewebsites.net >> .env.production

echo Building frontend...
call npm run build

if errorlevel 1 (
  echo Build failed!
  pause
  exit /b 1
)

echo.
echo Deploying to Azure Static Web Apps...
call npx @azure/static-web-apps-cli deploy ^
  --app-location . ^
  --output-location dist ^
  --deployment-token c874a5640ef7dc30ec3aeb691edc99643f4a3e09dcecedb0ddad2f350a88775d03-a3a98183-3865-4f38-835b-0255cb71db4101009240964fd410

echo.
echo ========================================
echo Frontend Deployment Complete!
echo ========================================
echo Check Azure portal for your Static Web App URL
echo ========================================

pause
