@echo off
echo ========================================
echo Deploying Field Service to Azure
echo ========================================
echo.

REM Deploy API
echo [1/2] Deploying API...
call az webapp up ^
  --runtime NODE:20-lts ^
  --sku B1 ^
  --name field-service-api ^
  --resource-group customer-portal_group ^
  --location centralus ^
  --logs

if errorlevel 1 (
  echo API deployment failed!
  pause
  exit /b 1
)

REM Configure API environment
echo.
echo Configuring API environment...
call az webapp config appsettings set ^
  --name field-service-api ^
  --resource-group customer-portal_group ^
  --settings ^
    DB_SERVER=customer-portal-sql-server.database.windows.net ^
    DB_NAME=FieldServiceDB ^
    DB_USER=sqladmin ^
    DB_PASSWORD=CustomerPortal2025! ^
    DB_AUTH=sql ^
    NODE_ENV=production

REM Enable CORS
call az webapp cors add ^
  --name field-service-api ^
  --resource-group customer-portal_group ^
  --allowed-origins "*"

echo.
echo [2/2] Building and deploying frontend...
call npm run build

if errorlevel 1 (
  echo Frontend build failed!
  pause
  exit /b 1
)

cd dist
call az webapp up ^
  --runtime NODE:20-lts ^
  --sku B1 ^
  --name field-service-app ^
  --resource-group customer-portal_group ^
  --location centralus ^
  --html

cd ..

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo API: https://field-service-api.azurewebsites.net
echo App: https://field-service-app.azurewebsites.net
echo ========================================

pause
