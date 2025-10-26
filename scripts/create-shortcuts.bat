@echo off
setlocal EnableDelayedExpansion

:: Create Desktop Shortcuts Script
:: Creates convenient shortcuts for users

echo.
echo ==========================================
echo Creating Desktop Shortcuts
echo ==========================================
echo.

set "INSTALL_DIR=%~dp0.."
set "DESKTOP=%USERPROFILE%\Desktop"
set "START_MENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs"

echo Installation Directory: %INSTALL_DIR%
echo Desktop: %DESKTOP%
echo.

:: Create Field Service folder in Start Menu
if not exist "%START_MENU%\Field Service System" (
    mkdir "%START_MENU%\Field Service System"
)

:: Create desktop shortcut to web application
echo Creating web application shortcut...
echo Set WshShell = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set Shortcut = WshShell.CreateShortcut("%DESKTOP%\Field Service System.lnk") >> temp_shortcut.vbs
echo Shortcut.TargetPath = "http://localhost:5000" >> temp_shortcut.vbs
echo Shortcut.Description = "Field Service Management System" >> temp_shortcut.vbs
echo Shortcut.Save >> temp_shortcut.vbs
cscript temp_shortcut.vbs >nul
del temp_shortcut.vbs
echo [√] Desktop shortcut created: Field Service System.lnk

:: Create start menu shortcut to web application
echo Set WshShell = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set Shortcut = WshShell.CreateShortcut("%START_MENU%\Field Service System\Field Service System.lnk") >> temp_shortcut.vbs
echo Shortcut.TargetPath = "http://localhost:5000" >> temp_shortcut.vbs
echo Shortcut.Description = "Field Service Management System" >> temp_shortcut.vbs
echo Shortcut.Save >> temp_shortcut.vbs
cscript temp_shortcut.vbs >nul
del temp_shortcut.vbs

:: Create start menu shortcut to start application
echo Set WshShell = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set Shortcut = WshShell.CreateShortcut("%START_MENU%\Field Service System\Start Application.lnk") >> temp_shortcut.vbs
echo Shortcut.TargetPath = "%INSTALL_DIR%\scripts\start-application.bat" >> temp_shortcut.vbs
echo Shortcut.WorkingDirectory = "%INSTALL_DIR%\scripts" >> temp_shortcut.vbs
echo Shortcut.Description = "Start Field Service Application Server" >> temp_shortcut.vbs
echo Shortcut.Save >> temp_shortcut.vbs
cscript temp_shortcut.vbs >nul
del temp_shortcut.vbs

:: Create start menu shortcut to backup database
echo Set WshShell = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set Shortcut = WshShell.CreateShortcut("%START_MENU%\Field Service System\Backup Database.lnk") >> temp_shortcut.vbs
echo Shortcut.TargetPath = "%INSTALL_DIR%\scripts\backup-database.bat" >> temp_shortcut.vbs
echo Shortcut.WorkingDirectory = "%INSTALL_DIR%\scripts" >> temp_shortcut.vbs
echo Shortcut.Description = "Backup Field Service Database" >> temp_shortcut.vbs
echo Shortcut.Save >> temp_shortcut.vbs
cscript temp_shortcut.vbs >nul
del temp_shortcut.vbs

:: Create start menu shortcut to documentation
echo Set WshShell = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set Shortcut = WshShell.CreateShortcut("%START_MENU%\Field Service System\User Manual.lnk") >> temp_shortcut.vbs
echo Shortcut.TargetPath = "%INSTALL_DIR%\README-DISTRIBUTION.md" >> temp_shortcut.vbs
echo Shortcut.WorkingDirectory = "%INSTALL_DIR%" >> temp_shortcut.vbs
echo Shortcut.Description = "Field Service System Documentation" >> temp_shortcut.vbs
echo Shortcut.Save >> temp_shortcut.vbs
cscript temp_shortcut.vbs >nul
del temp_shortcut.vbs

:: Create start menu shortcut to admin tools folder
echo Set WshShell = WScript.CreateObject("WScript.Shell") > temp_shortcut.vbs
echo Set Shortcut = WshShell.CreateShortcut("%START_MENU%\Field Service System\Admin Tools.lnk") >> temp_shortcut.vbs
echo Shortcut.TargetPath = "%INSTALL_DIR%\scripts" >> temp_shortcut.vbs
echo Shortcut.Description = "Field Service Administration Tools" >> temp_shortcut.vbs
echo Shortcut.Save >> temp_shortcut.vbs
cscript temp_shortcut.vbs >nul
del temp_shortcut.vbs

echo [√] Start Menu shortcuts created

echo.
echo ==========================================
echo Shortcuts Created Successfully!
echo ==========================================
echo.
echo Desktop:
echo - Field Service System (opens web application)
echo.
echo Start Menu → Field Service System:
echo - Field Service System (web application)
echo - Start Application (server startup)
echo - Backup Database (manual backup)
echo - User Manual (documentation)
echo - Admin Tools (administration scripts)
echo.
echo Users can now easily access the system from
echo the desktop or Start Menu.

exit /b 0