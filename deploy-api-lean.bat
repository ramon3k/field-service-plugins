@echo off
echo ========================================
echo Deploying API to Azure (Server-Only)
echo ========================================
echo.

cd /d "%~dp0"

echo Creating server-only deployment package...
if exist "api-deploy.zip" del "api-deploy.zip"

cd server
powershell -Command "Compress-Archive -Path '*.cjs', '*.js', 'package.json', '..\\.deployment' -DestinationPath '..\\api-deploy.zip' -Force"
cd ..

echo Package created: api-deploy.zip
powershell -Command "(Get-Item 'api-deploy.zip').Length / 1MB | ForEach-Object { Write-Host \"$([math]::Round($_, 2)) MB\" }"

echo.
echo Deploying to Azure App Service...
az webapp deploy --resource-group customer-portal_group --name field-service-api --src-path api-deploy.zip --type zip --restart true --timeout 600

echo.
echo ========================================
echo Deployment complete! Testing API...
echo ========================================
timeout /t 5

powershell -Command "try { $test = Invoke-RestMethod -Uri 'https://field-service-api.azurewebsites.net/api/test' -TimeoutSec 15; Write-Host 'SUCCESS! API is working!' -ForegroundColor Green; $test } catch { Write-Host 'Error: ' $_.Exception.Message -ForegroundColor Red }"

pause
