@echo off
setlocal EnableDelayedExpansion

REM Reset SQL Server SA Password
REM This uses Windows Authentication to reset the SA password

echo.
echo ==========================================
echo SQL Server SA Password Reset
echo ==========================================
echo.

REM Check for admin rights
net session >nul 2>&1
if !errorLevel! neq 0 (
    echo ERROR: This script requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo This will reset the SQL Server SA password.
echo.
set /p NEW_PASSWORD=Enter new SA password: 

if "!NEW_PASSWORD!"=="" (
    echo ERROR: Password cannot be empty
    pause
    exit /b 1
)

echo.
echo Attempting to reset SA password using Windows Authentication...
echo.

REM Try to reset password using Windows Authentication
sqlcmd -S .\SQLEXPRESS -E -Q "ALTER LOGIN sa WITH PASSWORD = '!NEW_PASSWORD!'; ALTER LOGIN sa ENABLE;"

if !errorLevel! equ 0 (
    echo.
    echo [OK] SA password has been reset successfully!
    echo.
    echo Your new SA password is: !NEW_PASSWORD!
    echo.
    echo IMPORTANT: Write this down in a safe place!
    echo.
    
    REM Update config.json with new password
    set "CONFIG_FILE=%~dp0config.json"
    if exist "!CONFIG_FILE!" (
        echo.
        echo Updating config.json with new password...
        
        REM Create a temporary PowerShell script to update JSON
        echo $json = Get-Content '!CONFIG_FILE!' ^| ConvertFrom-Json > temp-update-config.ps1
        echo $json.DatabasePassword = '!NEW_PASSWORD!' >> temp-update-config.ps1
        echo $json.DatabaseAuth = 'SQL' >> temp-update-config.ps1
        echo $json.DatabaseUser = 'sa' >> temp-update-config.ps1
        echo $json ^| ConvertTo-Json -Depth 10 ^| Set-Content '!CONFIG_FILE!' >> temp-update-config.ps1
        
        powershell -ExecutionPolicy Bypass -File temp-update-config.ps1
        del temp-update-config.ps1
        
        if !errorLevel! equ 0 (
            echo [OK] config.json updated with new password
        ) else (
            echo WARNING: Could not automatically update config.json
            echo Please manually update DatabasePassword in config.json
        )
    )
) else (
    echo.
    echo ERROR: Failed to reset password
    echo.
    echo Possible causes:
    echo - SQL Server is not running
    echo - Windows Authentication is not enabled
    echo - You don't have permission
    echo.
    echo Try starting SQL Server:
    echo   net start MSSQL$SQLEXPRESS
    echo.
)

echo.
pause
