@echo off
setlocal EnableDelayedExpansion

:: Refresh Environment Variables Script
:: Forces refresh of environment variables without reboot

echo Refreshing environment variables...

:: Refresh PATH from registry
for /f "usebackq tokens=2,*" %%A in (`reg query "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v PATH`) do set SystemPath=%%B
for /f "usebackq tokens=2,*" %%A in (`reg query "HKEY_CURRENT_USER\Environment" /v PATH 2^>nul`) do set UserPath=%%B

:: Set the new PATH
if defined UserPath (
    set "PATH=%SystemPath%;%UserPath%"
) else (
    set "PATH=%SystemPath%"
)

:: Refresh other common environment variables
for /f "usebackq tokens=2,*" %%A in (`reg query "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v NODE_PATH 2^>nul`) do set NODE_PATH=%%B

echo Environment variables refreshed.
echo NODE.JS should now be available in PATH.

:: Test Node.js availability
node --version >nul 2>&1
if %errorLevel% equ 0 (
    echo [√] Node.js is now available
) else (
    echo [!] Node.js still not available - may need system restart
)

exit /b 0