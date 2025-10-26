@echo off
REM ============================================================================
REM Update Existing Data with CompanyCode
REM ============================================================================
REM This script reads the CompanyCode from config.json and updates all
REM existing records in the database to use that company code
REM ============================================================================

setlocal enabledelayedexpansion

echo ========================================
echo Update Existing Data with CompanyCode
echo ========================================
echo.

REM Check if config.json exists
if not exist "config.json" (
    echo [ERROR] config.json not found!
    echo Please run CONFIGURE.bat first to set up your company code.
    pause
    exit /b 1
)

REM Read CompanyCode from config.json
echo [1/3] Reading company code from config.json...
for /f "tokens=2 delims=:," %%a in ('type config.json ^| findstr /C:"CompanyCode"') do (
    set "COMPANY_CODE=%%~a"
    set "COMPANY_CODE=!COMPANY_CODE: =!"
    set "COMPANY_CODE=!COMPANY_CODE:"=!"
)

if "!COMPANY_CODE!"=="" (
    echo [ERROR] CompanyCode not found in config.json
    echo Please run CONFIGURE.bat and set a company code.
    pause
    exit /b 1
)

echo [√] Company Code: !COMPANY_CODE!
echo.

REM Read database configuration
echo [2/3] Reading database configuration...
for /f "tokens=2 delims=:," %%a in ('type config.json ^| findstr /C:"DatabaseName"') do (
    set "DB_NAME=%%~a"
    set "DB_NAME=!DB_NAME: =!"
    set "DB_NAME=!DB_NAME:"=!"
)

for /f "tokens=2 delims=:," %%a in ('type config.json ^| findstr /C:"DatabaseServer"') do (
    set "DB_SERVER=%%~a"
    set "DB_SERVER=!DB_SERVER: =!"
    set "DB_SERVER=!DB_SERVER:"=!"
    set "DB_SERVER=!DB_SERVER:\\=\!"
)

echo [√] Database: !DB_NAME! on !DB_SERVER!
echo.

REM Create SQL script to update data
echo [3/3] Updating all existing records with CompanyCode...

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Users SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Users Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Users table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Tickets SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Tickets Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Tickets table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Customers SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Customers Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Customers table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Sites SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Sites Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Sites table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE ServiceRequests SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'ServiceRequests Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update ServiceRequests table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Assets SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Assets Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Assets table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Vendors SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Vendors Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Vendors table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Attachments SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Attachments Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Attachments table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE ActivityLog SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'ActivityLog Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update ActivityLog table
    goto :error
)

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "UPDATE Licenses SET CompanyCode = '!COMPANY_CODE!' WHERE CompanyCode = 'DEFAULT'; SELECT @@ROWCOUNT AS 'Licenses Updated';"
if errorlevel 1 (
    echo [ERROR] Failed to update Licenses table
    goto :error
)

echo.
echo ========================================
echo SUCCESS: All data updated!
echo ========================================
echo.
echo CompanyCode '!COMPANY_CODE!' has been applied to all existing records.
echo.
echo IMPORTANT: New records will automatically use this company code
echo once the API server is updated to include CompanyCode filtering.
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo ERROR: Update failed!
echo ========================================
echo.
echo Please check:
echo 1. SQL Server is running
echo 2. Database '!DB_NAME!' exists
echo 3. You have permission to update records
echo.
pause
exit /b 1
