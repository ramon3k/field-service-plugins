@echo off
setlocal EnableDelayedExpansion

:: Production Build Script for Field Service Management System
:: Creates a clean distribution package ready for customer deployment

echo.
echo ========================================
echo Field Service System - Production Build
echo ========================================
echo.

set "SOURCE_DIR=%~dp0"
set "BUILD_DIR=%~dp0dist"
set "PACKAGE_NAME=FieldServiceSystem-v1.0"
set "PACKAGE_DIR=%BUILD_DIR%\%PACKAGE_NAME%"

echo Source Directory: %SOURCE_DIR%
echo Build Directory: %BUILD_DIR%
echo Package Name: %PACKAGE_NAME%
echo.

:: Clean previous build
if exist "%BUILD_DIR%" (
    echo Cleaning previous build...
    rmdir /s /q "%BUILD_DIR%"
)

:: Create build structure
echo Creating distribution structure...
mkdir "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%\server"
mkdir "%PACKAGE_DIR%\database"
mkdir "%PACKAGE_DIR%\scripts"
mkdir "%PACKAGE_DIR%\installers"
mkdir "%PACKAGE_DIR%\docs"
mkdir "%PACKAGE_DIR%\client"
mkdir "%PACKAGE_DIR%\logs"

echo [√] Directory structure created

:: Copy documentation files
echo.
echo Copying documentation...
copy "%SOURCE_DIR%README-DISTRIBUTION.md" "%PACKAGE_DIR%\README.md" >nul
copy "%SOURCE_DIR%QUICK-START.md" "%PACKAGE_DIR%\" >nul
copy "%SOURCE_DIR%INSTALLATION-CHECKLIST.md" "%PACKAGE_DIR%\" >nul
copy "%SOURCE_DIR%TECHNICAL-REQUIREMENTS.md" "%PACKAGE_DIR%\" >nul
echo [√] Documentation copied

:: Copy installation scripts
echo.
echo Copying installation scripts...
copy "%SOURCE_DIR%SETUP.bat" "%PACKAGE_DIR%\" >nul
copy "%SOURCE_DIR%UNINSTALL.bat" "%PACKAGE_DIR%\" >nul
xcopy "%SOURCE_DIR%scripts\*" "%PACKAGE_DIR%\scripts\" /s /q
copy "%SOURCE_DIR%installers\README.md" "%PACKAGE_DIR%\installers\" >nul
echo [√] Installation scripts copied

:: Copy server files (production only)
echo.
echo Copying server application...

:: Server package.json (production dependencies only)
if exist "%SOURCE_DIR%server\package.json" (
    copy "%SOURCE_DIR%server\package.json" "%PACKAGE_DIR%\server\" >nul
)

:: Server application files
for %%f in (
    api-server.js
    api.js
    server.js
    simple-auth.js
) do (
    if exist "%SOURCE_DIR%server\%%f" (
        copy "%SOURCE_DIR%server\%%f" "%PACKAGE_DIR%\server\" >nul
    )
)

:: Server middleware and routes
if exist "%SOURCE_DIR%server\middleware" (
    xcopy "%SOURCE_DIR%server\middleware\*" "%PACKAGE_DIR%\server\middleware\" /s /q
)
if exist "%SOURCE_DIR%server\routes" (
    xcopy "%SOURCE_DIR%server\routes\*" "%PACKAGE_DIR%\server\routes\" /s /q
)

:: Environment template
if exist "%SOURCE_DIR%server\.env.example" (
    copy "%SOURCE_DIR%server\.env.example" "%PACKAGE_DIR%\server\" >nul
)

echo [√] Server files copied

:: Copy database files
echo.
echo Copying database files...
copy "%SOURCE_DIR%database\create-database.sql" "%PACKAGE_DIR%\database\" >nul
copy "%SOURCE_DIR%database\import-sample-data.sql" "%PACKAGE_DIR%\database\" >nul 2>nul
copy "%SOURCE_DIR%server\create-tenant-registry.sql" "%PACKAGE_DIR%\database\" >nul 2>nul
echo [√] Database files copied

:: Build and copy client application
echo.
echo Building client application...
cd /d "%SOURCE_DIR%"

:: Check if we have a React build setup
if exist "package.json" (
    echo Installing client dependencies...
    call npm install >nul 2>&1
    
    echo Building production client...
    call npm run build >nul 2>&1
    
    if exist "dist" (
        xcopy "dist\*" "%PACKAGE_DIR%\client\" /s /q
        echo [√] Client application built and copied
    ) else if exist "build" (
        xcopy "build\*" "%PACKAGE_DIR%\client\" /s /q
        echo [√] Client application built and copied
    ) else (
        echo [!] Client build not found - copying source files
        xcopy "src\*" "%PACKAGE_DIR%\client\src\" /s /q
        copy "index.html" "%PACKAGE_DIR%\client\" >nul 2>nul
        copy "package.json" "%PACKAGE_DIR%\client\" >nul 2>nul
        copy "vite.config.ts" "%PACKAGE_DIR%\client\" >nul 2>nul
        copy "tsconfig.json" "%PACKAGE_DIR%\client\" >nul 2>nul
    )
) else (
    echo [!] No client package.json found - copying available files
    if exist "src" (
        xcopy "src\*" "%PACKAGE_DIR%\client\src\" /s /q
    )
    if exist "public" (
        xcopy "public\*" "%PACKAGE_DIR%\client\public\" /s /q
    )
    copy "index.html" "%PACKAGE_DIR%\client\" >nul 2>nul
)

:: Create license and legal files
echo.
echo Creating license files...
echo Creating basic license and legal documents...

:: Create LICENSE.txt
echo SOFTWARE LICENSE AGREEMENT > "%PACKAGE_DIR%\LICENSE.txt"
echo Field Service Management System v1.0 >> "%PACKAGE_DIR%\LICENSE.txt"
echo. >> "%PACKAGE_DIR%\LICENSE.txt"
echo This software is licensed for use by the purchasing organization. >> "%PACKAGE_DIR%\LICENSE.txt"
echo. >> "%PACKAGE_DIR%\LICENSE.txt"
echo TERMS OF USE: >> "%PACKAGE_DIR%\LICENSE.txt"
echo 1. This software is licensed, not sold >> "%PACKAGE_DIR%\LICENSE.txt"
echo 2. The license grants the right to use the software for business purposes >> "%PACKAGE_DIR%\LICENSE.txt"
echo 3. The purchasing organization owns all data entered into the system >> "%PACKAGE_DIR%\LICENSE.txt"
echo 4. Support and updates are provided according to the support agreement >> "%PACKAGE_DIR%\LICENSE.txt"
echo 5. This software may not be redistributed without permission >> "%PACKAGE_DIR%\LICENSE.txt"
echo. >> "%PACKAGE_DIR%\LICENSE.txt"
echo Copyright (c) 2025 [Your Company Name] >> "%PACKAGE_DIR%\LICENSE.txt"
echo All rights reserved. >> "%PACKAGE_DIR%\LICENSE.txt"

:: Create release notes
echo RELEASE NOTES > "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo Field Service Management System v1.0 >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo Release Date: October 2025 >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo. >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo NEW FEATURES: >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Complete customer and site management >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Service ticket tracking and assignment >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - User management with role-based access >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Asset tracking and maintenance scheduling >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Mobile-responsive interface >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Automated backup and restore capabilities >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - CSV export functionality >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Activity logging and audit trails >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo. >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo SYSTEM REQUIREMENTS: >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Windows 10/11 or Windows Server 2019+ >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - 4GB RAM minimum, 8GB recommended >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - 5GB free disk space >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - SQL Server Express 2019+ (included) >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"
echo - Node.js 18+ (included) >> "%PACKAGE_DIR%\RELEASE-NOTES.txt"

echo [√] License and release notes created

:: Create version file
echo.
echo Creating version information...
echo VERSION=1.0 > "%PACKAGE_DIR%\VERSION"
echo BUILD_DATE=%date% %time% >> "%PACKAGE_DIR%\VERSION"
echo BUILD_TYPE=Production >> "%PACKAGE_DIR%\VERSION"
echo [√] Version file created

:: Clean up development files that shouldn't be distributed
echo.
echo Cleaning development files...

:: Remove common development files from the package
del "%PACKAGE_DIR%\server\*.log" >nul 2>&1
del "%PACKAGE_DIR%\*.log" >nul 2>&1
del "%PACKAGE_DIR%\server\.env" >nul 2>&1
rmdir /s /q "%PACKAGE_DIR%\server\node_modules" >nul 2>&1
rmdir /s /q "%PACKAGE_DIR%\client\node_modules" >nul 2>&1
rmdir /s /q "%PACKAGE_DIR%\.git" >nul 2>&1

echo [√] Development files cleaned

:: Create installation verification
echo.
echo Creating installation verification...

:: Create a simple verification script
echo @echo off > "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo :: Package Verification Script >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo echo Verifying Field Service System package... >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo. >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo set ERRORS=0 >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo. >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo if not exist "README.md" (echo [X] README.md missing ^& set /a ERRORS+=1) else (echo [√] README.md found) >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo if not exist "SETUP.bat" (echo [X] SETUP.bat missing ^& set /a ERRORS+=1) else (echo [√] SETUP.bat found) >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo if not exist "server\package.json" (echo [X] Server package.json missing ^& set /a ERRORS+=1) else (echo [√] Server package.json found) >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo if not exist "database\create-database.sql" (echo [X] Database schema missing ^& set /a ERRORS+=1) else (echo [√] Database schema found) >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo if not exist "scripts\create-database.bat" (echo [X] Installation scripts missing ^& set /a ERRORS+=1) else (echo [√] Installation scripts found) >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo. >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo if %%ERRORS%% equ 0 (echo. ^& echo [√] Package verification PASSED - ready for distribution) else (echo. ^& echo [X] Package verification FAILED - %%ERRORS%% errors found) >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"
echo pause >> "%PACKAGE_DIR%\VERIFY-PACKAGE.bat"

echo [√] Package verification script created

:: Generate package summary
echo.
echo Generating package summary...

echo FIELD SERVICE MANAGEMENT SYSTEM > "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo Distribution Package v1.0 >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo Built on: %date% %time% >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo. >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo PACKAGE CONTENTS: >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"

:: Count files in each directory
for /f %%a in ('dir "%PACKAGE_DIR%\server" /b /a-d 2^>nul ^| find /c /v ""') do echo - Server files: %%a >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
for /f %%a in ('dir "%PACKAGE_DIR%\database" /b /a-d 2^>nul ^| find /c /v ""') do echo - Database files: %%a >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
for /f %%a in ('dir "%PACKAGE_DIR%\scripts" /b /a-d 2^>nul ^| find /c /v ""') do echo - Installation scripts: %%a >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
for /f %%a in ('dir "%PACKAGE_DIR%" /b /a-d *.md *.txt *.bat 2^>nul ^| find /c /v ""') do echo - Documentation files: %%a >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"

echo. >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo INSTALLATION: >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo 1. Extract this package to desired location >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo 2. Right-click SETUP.bat and "Run as Administrator" >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo 3. Follow the installation prompts >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo 4. Access the system at http://localhost:5000 >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo. >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo SUPPORT: >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo Email: support@yourcompany.com >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo Phone: 1-800-XXX-XXXX >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"
echo Documentation: See README.md >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"

:: Calculate package size
for /f "tokens=3" %%a in ('dir "%PACKAGE_DIR%" /-c /s ^| find "bytes"') do set PACKAGE_SIZE=%%a
set /a PACKAGE_SIZE_MB=%PACKAGE_SIZE:~0,-6%
echo Package Size: %PACKAGE_SIZE_MB% MB >> "%PACKAGE_DIR%\PACKAGE-SUMMARY.txt"

echo [√] Package summary generated

echo.
echo ========================================
echo Production Build Complete!
echo ========================================
echo.
echo Package Location: %PACKAGE_DIR%
echo Package Size: %PACKAGE_SIZE_MB% MB
echo.

:: List main package contents
echo Package Contents:
dir "%PACKAGE_DIR%" /b

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo 1. Review the package contents in: %PACKAGE_DIR%
echo 2. Run VERIFY-PACKAGE.bat to check completeness
echo 3. Test installation on a clean machine
echo 4. Create ZIP file for distribution
echo 5. Update support contact information
echo.

choice /c YN /m "Would you like to create a ZIP file for distribution"
if %errorLevel% equ 1 (
    echo.
    echo Creating distribution ZIP file...
    cd /d "%BUILD_DIR%"
    
    :: Create ZIP using PowerShell (Windows 10+)
    powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%\*' -DestinationPath '%PACKAGE_NAME%.zip' -Force"
    
    if exist "%PACKAGE_NAME%.zip" (
        echo [√] ZIP file created: %BUILD_DIR%\%PACKAGE_NAME%.zip
        
        :: Get ZIP file size
        for %%A in ("%PACKAGE_NAME%.zip") do set "ZIPSIZE=%%~zA"
        set /a ZIPSIZE_MB=%ZIPSIZE%/1024/1024
        echo ZIP Size: %ZIPSIZE_MB% MB
    ) else (
        echo [!] Could not create ZIP file - create manually if needed
    )
)

echo.
echo Distribution package is ready!
echo Location: %BUILD_DIR%
echo.
echo Remember to:
echo - Update contact information in documentation
echo - Test installation on clean system
echo - Include prerequisite installers in 'installers' folder
echo - Review license terms

pause
exit /b 0