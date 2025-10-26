@echo off
title Field Service - Website Deployment Package

echo.
echo ================================================
echo   🌐 Field Service - Website Deployment
echo ================================================
echo.
echo This creates a deployment package for your existing website
echo.

REM Check if this is the right directory
if not exist "package.json" (
    echo ❌ Error: No package.json found
    echo Please run this from the field-service-react directory
    pause
    exit /b 1
)

echo ✅ Field Service project detected
echo.

REM Clean previous build
if exist "dist" rmdir /s /q dist
if exist "website-deployment" rmdir /s /q website-deployment

echo 📦 Building React app for production...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully
echo.

echo 📁 Creating website deployment package...
mkdir website-deployment
mkdir website-deployment\field-service

REM Copy built files
xcopy dist\* website-deployment\field-service\ /s /e /q

REM Create deployment instructions
echo # Field Service Deployment Instructions > website-deployment\DEPLOY-INSTRUCTIONS.txt
echo. >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo Upload the 'field-service' folder to your website: >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo. >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo 1. Upload field-service/ folder to: yoursite.com/field-service/ >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo 2. Ensure your API is configured for: >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo    https://your-app-service.azurewebsites.net/api/field-service >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo 3. Test at: https://yoursite.com/field-service/ >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo. >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo CORS Configuration needed in your API: >> website-deployment\DEPLOY-INSTRUCTIONS.txt
echo   origin: ['https://yoursite.com', 'https://www.yoursite.com'] >> website-deployment\DEPLOY-INSTRUCTIONS.txt

REM Create a sample .htaccess for Apache servers
echo # Apache configuration for React Router > website-deployment\field-service\.htaccess
echo Options -MultiViews >> website-deployment\field-service\.htaccess
echo RewriteEngine On >> website-deployment\field-service\.htaccess
echo RewriteCond %%{REQUEST_FILENAME} !-f >> website-deployment\field-service\.htaccess
echo RewriteRule ^ index.html [QSA,L] >> website-deployment\field-service\.htaccess

REM Create web.config for IIS servers
echo ^<?xml version="1.0" encoding="utf-8"?^> > website-deployment\field-service\web.config
echo ^<configuration^> >> website-deployment\field-service\web.config
echo   ^<system.webServer^> >> website-deployment\field-service\web.config
echo     ^<rewrite^> >> website-deployment\field-service\web.config
echo       ^<rules^> >> website-deployment\field-service\web.config
echo         ^<rule name="React Routes" stopProcessing="true"^> >> website-deployment\field-service\web.config
echo           ^<match url=".*" /^> >> website-deployment\field-service\web.config
echo           ^<conditions logicalGrouping="MatchAll"^> >> website-deployment\field-service\web.config
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /^> >> website-deployment\field-service\web.config
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" /^> >> website-deployment\field-service\web.config
echo           ^</conditions^> >> website-deployment\field-service\web.config
echo           ^<action type="Rewrite" url="/" /^> >> website-deployment\field-service\web.config
echo         ^</rule^> >> website-deployment\field-service\web.config
echo       ^</rules^> >> website-deployment\field-service\web.config
echo     ^</rewrite^> >> website-deployment\field-service\web.config
echo   ^</system.webServer^> >> website-deployment\field-service\web.config
echo ^</configuration^> >> website-deployment\field-service\web.config

REM Create ZIP package
echo 📦 Creating ZIP package...
powershell -Command "Compress-Archive -Path website-deployment\* -DestinationPath field-service-website.zip -Force"

REM Get package size
for %%I in (field-service-website.zip) do set size=%%~zI
set /a size_mb=%size% / 1024 / 1024

echo.
echo ================================================
echo   ✅ Website Deployment Package Ready!
echo ================================================
echo.
echo 📁 Package: field-service-website.zip (%size_mb% MB)
echo 📂 Folder: website-deployment\field-service\
echo.
echo 🚀 Next Steps:
echo    1. Upload 'field-service' folder to your website
echo    2. Place it at: yoursite.com/field-service/
echo    3. Update CORS in your Azure App Service API
echo    4. Test at: https://yoursite.com/field-service/
echo.
echo 📋 What's included:
echo    • Built React application
echo    • .htaccess for Apache servers
echo    • web.config for IIS servers  
echo    • Deployment instructions
echo.
echo 🔧 CORS Configuration for your API:
echo    Add your website domain to CORS origins in field-service routes
echo.

REM Open deployment folder
echo 📁 Opening deployment folder...
start explorer website-deployment

echo.
echo 🎯 Your field service SaaS is ready to deploy!
echo    Frontend: Your existing website
echo    Backend: Your existing Azure App Service
echo    Cost: $0 additional (uses existing infrastructure)
echo.
pause