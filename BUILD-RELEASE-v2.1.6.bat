@echo off
setlocal EnableDelayedExpansion

:: Field Service Management System v2.1.6 Release Builder
:: Creates production-ready distribution package

echo.
echo ===============================================
echo  Field Service System - Release v2.1.6
echo ===============================================
echo.

set "VERSION=2.1.6"
set "SOURCE_DIR=%~dp0"
set "RELEASE_DIR=%SOURCE_DIR%release-v%VERSION%"
set "PACKAGE_NAME=field-service-plugins-v%VERSION%"

echo Building release package: %PACKAGE_NAME%
echo.

:: Clean previous release build
if exist "%RELEASE_DIR%" (
    echo Cleaning previous release build...
    rmdir /s /q "%RELEASE_DIR%"
)

:: Create release directory structure
echo Creating release structure...
mkdir "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%\server"
mkdir "%RELEASE_DIR%\server\middleware"
mkdir "%RELEASE_DIR%\server\routes"
mkdir "%RELEASE_DIR%\server\utils"
mkdir "%RELEASE_DIR%\server\plugins"
mkdir "%RELEASE_DIR%\server\uploads"
mkdir "%RELEASE_DIR%\server\storage"
mkdir "%RELEASE_DIR%\database"
mkdir "%RELEASE_DIR%\scripts"
mkdir "%RELEASE_DIR%\installers"
mkdir "%RELEASE_DIR%\plugin-templates"
mkdir "%RELEASE_DIR%\example-plugin"

echo [√] Directory structure created
echo.

:: Build the React frontend
echo Building React frontend...
cd /d "%SOURCE_DIR%"
call npm run build
if errorlevel 1 (
    echo [X] Frontend build failed!
    pause
    exit /b 1
)
echo [√] Frontend built successfully
echo.

:: Copy built frontend (dist folder)
echo Copying frontend distribution...
xcopy "%SOURCE_DIR%dist\*" "%RELEASE_DIR%\dist\" /s /e /q /y
echo [√] Frontend copied

:: Copy server files
echo.
echo Copying server files...
copy "%SOURCE_DIR%server\api.cjs" "%RELEASE_DIR%\server\" >nul
copy "%SOURCE_DIR%server\package.json" "%RELEASE_DIR%\server\" >nul
copy "%SOURCE_DIR%server\.env.example" "%RELEASE_DIR%\server\" >nul
copy "%SOURCE_DIR%server\tenant-connection-manager.js" "%RELEASE_DIR%\server\" >nul
copy "%SOURCE_DIR%server\tenant-middleware.js" "%RELEASE_DIR%\server\" >nul
copy "%SOURCE_DIR%server\plugin-manager.js" "%RELEASE_DIR%\server\" >nul
copy "%SOURCE_DIR%server\web.config" "%RELEASE_DIR%\server\" >nul

:: Copy server subdirectories
xcopy "%SOURCE_DIR%server\middleware\*" "%RELEASE_DIR%\server\middleware\" /s /e /q /y
xcopy "%SOURCE_DIR%server\routes\*" "%RELEASE_DIR%\server\routes\" /s /e /q /y
xcopy "%SOURCE_DIR%server\utils\*" "%RELEASE_DIR%\server\utils\" /s /e /q /y

:: Copy only the time-clock plugin (given away with release)
mkdir "%RELEASE_DIR%\server\plugins" >nul 2>&1
copy "%SOURCE_DIR%server\plugins\time-clock-plugin.zip" "%RELEASE_DIR%\server\plugins\" >nul 2>nul
echo. > "%RELEASE_DIR%\server\plugins\.gitkeep"

:: Create empty uploads and storage directories with .gitkeep
echo. > "%RELEASE_DIR%\server\uploads\.gitkeep"
echo. > "%RELEASE_DIR%\server\storage\.gitkeep"

echo [√] Server files copied

:: Copy database scripts
echo.
echo Copying database scripts...
copy "%SOURCE_DIR%database\create-database-complete.sql" "%RELEASE_DIR%\database\" >nul
copy "%SOURCE_DIR%database\create-tenant-registry.sql" "%RELEASE_DIR%\database\" >nul
copy "%SOURCE_DIR%database\update-schema.sql" "%RELEASE_DIR%\database\" >nul 2>nul
echo [√] Database scripts copied

:: Copy setup and utility scripts
echo.
echo Copying installation scripts...
copy "%SOURCE_DIR%SETUP.bat" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%UPDATE.bat" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%CONFIGURE.bat" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%UNINSTALL.bat" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%START.bat" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%FIX-ENV.bat" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%DROP-DATABASE.bat" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%enable-sql-tcp.bat" "%RELEASE_DIR%\" >nul

xcopy "%SOURCE_DIR%scripts\*" "%RELEASE_DIR%\scripts\" /s /e /q /y

echo [√] Installation scripts copied

:: Copy documentation
echo.
echo Copying documentation...
copy "%SOURCE_DIR%README.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%README-DISTRIBUTION.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%CHANGELOG.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%LICENSE.txt" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%TECHNICAL-REQUIREMENTS.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%FRESH-INSTALL-GUIDE.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%LOCAL-INSTALL.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%PLUGIN-DEVELOPER-GUIDE.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%PLUGIN-PACKAGE-SPEC.md" "%RELEASE_DIR%\" >nul
copy "%SOURCE_DIR%SECURITY.md" "%RELEASE_DIR%\" >nul

echo [√] Documentation copied

:: Copy plugin templates and examples
echo.
echo Copying plugin templates...
xcopy "%SOURCE_DIR%plugin-templates\*" "%RELEASE_DIR%\plugin-templates\" /s /e /q /y
xcopy "%SOURCE_DIR%example-plugin\*" "%RELEASE_DIR%\example-plugin\" /s /e /q /y

echo [√] Plugin templates copied

:: Copy installer directory info (actual installers downloaded separately)
echo.
echo Creating installer directory...
copy "%SOURCE_DIR%installers\README.md" "%RELEASE_DIR%\installers\" >nul 2>nul
if not exist "%RELEASE_DIR%\installers\README.md" (
    echo # Required Installers > "%RELEASE_DIR%\installers\README.md"
    echo. >> "%RELEASE_DIR%\installers\README.md"
    echo Download these installers before running SETUP.bat: >> "%RELEASE_DIR%\installers\README.md"
    echo. >> "%RELEASE_DIR%\installers\README.md"
    echo 1. SQL Server Express 2019+ >> "%RELEASE_DIR%\installers\README.md"
    echo    https://www.microsoft.com/en-us/sql-server/sql-server-downloads >> "%RELEASE_DIR%\installers\README.md"
    echo. >> "%RELEASE_DIR%\installers\README.md"
    echo 2. Node.js v20 LTS >> "%RELEASE_DIR%\installers\README.md"
    echo    https://nodejs.org/en/download >> "%RELEASE_DIR%\installers\README.md"
)

echo [√] Installer directory created

:: Create release notes
echo.
echo Creating release notes...
echo Field Service Management System v%VERSION% > "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo Release Date: %date% >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo NEW IN v%VERSION%: >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo ### Technician Interface Enhancements >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Navigation tab system added to Technician dashboard >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Technicians can now access plugins via main navigation tabs >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Tabs filtered by role - only shows relevant plugins >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Matches coordinator dashboard styling for consistency >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Dynamic plugin component loading implemented >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Plugin frontends render properly when tabs are clicked >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Automatic component discovery through registry >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Graceful fallback for missing components >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo ### UI Improvements >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Fixed text contrast in Plugin Manager page >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Improved readability with darker text colors >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Enhanced accessibility on white backgrounds >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo SYSTEM REQUIREMENTS: >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Windows 10/11 or Windows Server 2019+ >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - 4GB RAM minimum, 8GB recommended >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - 10GB free disk space >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - SQL Server Express 2019+ >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo - Node.js v20 LTS >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo. >> "%RELEASE_DIR%\RELEASE-NOTES.txt"
echo See CHANGELOG.md for complete version history. >> "%RELEASE_DIR%\RELEASE-NOTES.txt"

echo [√] Release notes created

:: Create version file
echo.
echo Creating version file...
echo %VERSION% > "%RELEASE_DIR%\VERSION"
echo BUILD_DATE=%date% %time% >> "%RELEASE_DIR%\VERSION"
echo BUILD_TYPE=Production >> "%RELEASE_DIR%\VERSION"

echo [√] Version file created

:: Summary
echo.
echo ===============================================
echo  Release Package Built Successfully!
echo ===============================================
echo.
echo Release Directory: %RELEASE_DIR%
echo.

:: Calculate package size
for /f "tokens=3" %%a in ('dir "%RELEASE_DIR%" /-c /s ^| find "bytes"') do set PACKAGE_SIZE=%%a
set /a PACKAGE_SIZE_MB=%PACKAGE_SIZE:~0,-6%
echo Package Size: ~%PACKAGE_SIZE_MB% MB
echo.

:: Create ZIP file
echo.
choice /c YN /m "Create ZIP file for distribution"
if %errorLevel% equ 1 (
    echo.
    echo Creating ZIP archive...
    
    cd /d "%SOURCE_DIR%"
    powershell -Command "Compress-Archive -Path '%RELEASE_DIR%\*' -DestinationPath '%SOURCE_DIR%%PACKAGE_NAME%.zip' -Force"
    
    if exist "%SOURCE_DIR%%PACKAGE_NAME%.zip" (
        echo [√] ZIP created: %SOURCE_DIR%%PACKAGE_NAME%.zip
        
        for %%A in ("%PACKAGE_NAME%.zip") do set "ZIPSIZE=%%~zA"
        set /a ZIPSIZE_MB=!ZIPSIZE!/1024/1024
        echo ZIP Size: ~!ZIPSIZE_MB! MB
        echo.
        echo ===============================================
        echo  Ready for GitHub Release!
        echo ===============================================
        echo.
        echo Next steps:
        echo 1. Go to https://github.com/ramon3k/field-service-plugins/releases
        echo 2. Click "Draft a new release"
        echo 3. Choose tag: v%VERSION%
        echo 4. Upload: %PACKAGE_NAME%.zip
        echo 5. Copy release notes from RELEASE-NOTES.txt
        echo 6. Publish release
    ) else (
        echo [X] Failed to create ZIP file
        echo You can create it manually from: %RELEASE_DIR%
    )
) else (
    echo.
    echo Skipped ZIP creation
    echo You can create it manually from: %RELEASE_DIR%
)

echo.
echo Package is ready in: %RELEASE_DIR%
echo.
pause
