@echo off
REM Field Service Management System - Configuration Wizard Launcher

echo.
echo ========================================
echo  Configuration Wizard
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo NOTE: Administrator privileges recommended for full configuration
    echo.
)

REM Run the PowerShell configuration wizard
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\config-wizard.ps1"

if %errorLevel% equ 0 (
    echo.
    echo Configuration completed successfully!
    echo You can now run SETUP.bat to install the application.
) else (
    echo.
    echo Configuration was cancelled or failed.
)

echo.
pause
