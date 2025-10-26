@echo off
echo ========================================
echo Manual API Deployment to Azure
echo ========================================
echo.
echo This will create a deployment package and upload it
echo.
pause

cd /d "%~dp0"

echo.
echo Creating deployment package...
if exist "api-deploy.zip" del "api-deploy.zip"

powershell -Command "Compress-Archive -Path 'server\*', 'package.json', 'package-lock.json', '.deployment' -DestinationPath 'api-deploy.zip' -Force"

echo.
echo Package created: api-deploy.zip
echo Size:
powershell -Command "(Get-Item 'api-deploy.zip').Length / 1MB | ForEach-Object { Write-Host \"$([math]::Round($_, 2)) MB\" }"

echo.
echo Now deploying to Azure...
echo.

az webapp deployment source config-zip --name field-service-api --resource-group customer-portal_group --src api-deploy.zip

echo.
echo ========================================
echo Deployment complete!
echo Testing in 10 seconds...
echo ========================================
timeout /t 10

powershell -Command "try { $test = Invoke-RestMethod -Uri 'https://field-service-api.azurewebsites.net/api/test' -TimeoutSec 15; Write-Host 'SUCCESS! API is working!' -ForegroundColor Green; $test } catch { Write-Host 'Error: ' $_.Exception.Message -ForegroundColor Red }"

pause
