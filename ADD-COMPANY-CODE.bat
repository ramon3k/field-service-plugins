@echo off
REM ============================================================================
REM Add Company Code Support - Complete Migration
REM ============================================================================
REM This script runs all steps needed to add multi-tenant CompanyCode support
REM to an existing Field Service Management System installation
REM ============================================================================

setlocal enabledelayedexpansion

echo ========================================
echo Company Code Migration Wizard
echo ========================================
echo.
echo This will add multi-tenant CompanyCode support to your database.
echo Multiple vendors can use the same database with complete data isolation.
echo.
pause

REM ============================================================================
REM Step 1: Check if config.json has CompanyCode
REM ============================================================================
echo.
echo ========================================
echo Step 1: Configuration Check
echo ========================================
echo.

if not exist "config.json" (
    echo [!] config.json not found.
    echo.
    echo Please run CONFIGURE.bat first to set up your configuration.
    echo Make sure to set a CompanyCode when prompted.
    echo.
    pause
    exit /b 1
)

REM Check for CompanyCode in config
findstr /C:"CompanyCode" config.json >nul 2>&1
if errorlevel 1 (
    echo [!] CompanyCode not found in config.json
    echo.
    echo Please run CONFIGURE.bat and set a CompanyCode.
    echo.
    echo Example: KNIGHT for Knight Industries
    echo          ACME for Acme Corporation
    echo.
    pause
    exit /b 1
)

REM Read the CompanyCode
for /f "tokens=2 delims=:," %%a in ('type config.json ^| findstr /C:"CompanyCode"') do (
    set "COMPANY_CODE=%%~a"
    set "COMPANY_CODE=!COMPANY_CODE: =!"
    set "COMPANY_CODE=!COMPANY_CODE:"=!"
)

echo [√] Configuration found
echo [√] Company Code: !COMPANY_CODE!
echo.

REM ============================================================================
REM Step 2: Read database configuration
REM ============================================================================
echo ========================================
echo Step 2: Database Configuration
echo ========================================
echo.

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

echo [√] Database: !DB_NAME!
echo [√] Server: !DB_SERVER!
echo.

REM ============================================================================
REM Step 3: Run database schema migration
REM ============================================================================
echo ========================================
echo Step 3: Database Schema Migration
echo ========================================
echo.
echo This will add CompanyCode columns to all data tables...
echo.
pause

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -i "database\add-company-code-support.sql"
if errorlevel 1 (
    echo.
    echo [ERROR] Database schema migration failed!
    echo.
    echo Please check:
    echo 1. SQL Server is running
    echo 2. Database '!DB_NAME!' exists
    echo 3. You have permission to alter tables
    echo 4. File database\add-company-code-support.sql exists
    echo.
    pause
    exit /b 1
)

echo.
echo [√] Database schema updated successfully
echo.

REM ============================================================================
REM Step 4: Update existing data
REM ============================================================================
echo ========================================
echo Step 4: Update Existing Data
echo ========================================
echo.
echo This will update all existing records with your CompanyCode...
echo Current records have CompanyCode = 'DEFAULT'
echo They will be updated to CompanyCode = '!COMPANY_CODE!'
echo.
pause

call scripts\update-existing-data-company-code.bat
if errorlevel 1 (
    echo.
    echo [ERROR] Data update failed!
    echo Migration incomplete - please fix errors and try again.
    pause
    exit /b 1
)

echo.
echo [√] Existing data updated successfully
echo.

REM ============================================================================
REM Step 5: Verification
REM ============================================================================
echo ========================================
echo Step 5: Verification
echo ========================================
echo.
echo Checking migration results...
echo.

sqlcmd -S !DB_SERVER! -d !DB_NAME! -E -Q "SELECT CompanyCode, COUNT(*) AS Records FROM Users GROUP BY CompanyCode"

echo.
echo [?] Do all records show '!COMPANY_CODE!' (not DEFAULT)?
choice /C YN /M "Is the verification correct"
if errorlevel 2 (
    echo.
    echo [!] Verification failed. Please check the output above.
    echo You may need to run scripts\update-existing-data-company-code.bat again.
    echo.
    pause
    exit /b 1
)

REM ============================================================================
REM Success!
REM ============================================================================
echo.
echo ========================================
echo SUCCESS! Company Code Migration Complete
echo ========================================
echo.
echo Your database now has multi-tenant CompanyCode support!
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo 1. [CRITICAL] Update API server to filter by CompanyCode
echo    - See COMPANY-CODE-API-INTEGRATION.md for details
echo    - This is REQUIRED for data isolation security
echo.
echo 2. Test multi-tenant isolation:
echo    - Create test users with different CompanyCodes
echo    - Verify they cannot see each other's data
echo.
echo 3. Update your documentation
echo    - Inform users about CompanyCode requirement
echo    - Update deployment guides
echo.
echo For complete information, see:
echo - COMPANY-CODE-SETUP.md
echo - COMPANY-CODE-API-INTEGRATION.md
echo.
pause
