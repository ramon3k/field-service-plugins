@echo off
title Load Comprehensive Demo Data to Azure
echo.
echo ================================================================
echo   📊 Loading Comprehensive Demo Data to Azure SQL
echo ================================================================
echo.
echo This will:
echo   1. Create demo users across 8 states
echo   2. Create demo customers nationwide
echo   3. Create demo sites with geolocations
echo   4. Create demo licenses for each site
echo   5. Create 35+ demo tickets in various statuses
echo   6. Add activity logs and notes
echo.
echo ⚠️  WARNING: This will delete existing DEMO-* data!
echo.
pause

echo.
echo 🔌 Connecting to Azure SQL Server...
echo Server: customer-portal-sql-server.database.windows.net
echo Database: FieldServiceDB
echo.

REM Load comprehensive demo data
echo.
echo 📥 Step 1: Creating demo users, customers, sites, and licenses...
sqlcmd -S customer-portal-sql-server.database.windows.net -d FieldServiceDB -U %DB_USER% -P %DB_PASSWORD% -i "database\create-comprehensive-demo-data.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error loading demo data!
    pause
    exit /b 1
)

echo.
echo 📥 Step 2: Creating demo tickets with activity logs...
sqlcmd -S customer-portal-sql-server.database.windows.net -d FieldServiceDB -U %DB_USER% -P %DB_PASSWORD% -i "database\create-demo-tickets.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error loading demo tickets!
    pause
    exit /b 1
)

echo.
echo ================================================================
echo   ✅ Demo Data Loaded Successfully!
echo ================================================================
echo.
echo 📊 What was created:
echo    • 14 Demo Users (technicians in CA, TX, NY, FL, IL, WA, CO, GA)
echo    • 18 Demo Customers (nationwide coverage)
echo    • 27 Demo Sites (with real geocoordinates)
echo    • 22 Demo Licenses (security systems)
echo    • 35 Demo Tickets (various statuses and priorities)
echo    • Activity logs for in-progress tickets
echo    • Notes with customer context
echo.
echo 🎯 Ready to test!
echo.
echo To access demo data:
echo   • Login with: demo-admin / demo123
echo   • Or any demo-tech-XX user / demo123
echo   • Company Code: DEMO or KIT
echo.
echo All demo data is prefixed with DEMO- for easy identification.
echo.
pause
