@echo off
title Migrate Local Database to Azure SQL

echo.
echo ========================================================
echo   📦 Migrating FieldServiceDB to Azure SQL
echo ========================================================
echo.

set LOCAL_SERVER=localhost\SQLEXPRESS
set AZURE_SERVER=customer-portal-sql-server.database.windows.net
set DATABASE_NAME=FieldServiceDB
set BACKUP_FILE=%TEMP%\FieldServiceDB_Migration.bacpac
set SCRIPT_FILE=%TEMP%\FieldServiceDB_Schema.sql

echo Local Server: %LOCAL_SERVER%
echo Azure Server: %AZURE_SERVER%
echo Database: %DATABASE_NAME%
echo.

REM Get Azure SQL password
echo 🔐 Enter Azure SQL Admin Password:
set /p AZURE_PASSWORD=Password: 
if "%AZURE_PASSWORD%"=="" (
    echo ❌ Password cannot be empty
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   Method 1: Export Schema and Data via Scripts
echo ========================================================
echo.

REM Step 1: Generate schema script from local database
echo 📝 Step 1: Generating schema script from local database...
sqlcmd -S %LOCAL_SERVER% -E -d %DATABASE_NAME% -Q "SET NOCOUNT ON; SELECT 'CREATE TABLE ' + TABLE_NAME + ' ...' FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'" -h -1 -o "%SCRIPT_FILE%.temp"

REM Better approach: Use a comprehensive script that generates full DDL
echo.
echo 💡 Generating comprehensive database script...
echo -- Field Service Multi-Tenant Database Schema > "%SCRIPT_FILE%"
echo -- Generated: %DATE% %TIME% >> "%SCRIPT_FILE%"
echo -- Source: %LOCAL_SERVER%\%DATABASE_NAME% >> "%SCRIPT_FILE%"
echo. >> "%SCRIPT_FILE%"

REM Generate CREATE TABLE statements for all tables
sqlcmd -S %LOCAL_SERVER% -E -d %DATABASE_NAME% -Q "SELECT 'Table: ' + TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME" -h -1 -W

echo.
echo ========================================================
echo   Using SQL Server Management Studio (Recommended)
echo ========================================================
echo.
echo Since sqlcmd doesn't support full schema export, please use SSMS:
echo.
echo 1. Open SQL Server Management Studio (SSMS)
echo 2. Connect to: %LOCAL_SERVER%
echo 3. Right-click database: %DATABASE_NAME%
echo 4. Tasks ^> Generate Scripts...
echo 5. Select "Script entire database and all database objects"
echo 6. Click "Advanced" and set:
echo    - Types of data to script: Schema and data
echo    - Script for Server Version: Azure SQL Database
echo 7. Save to file: %SCRIPT_FILE%
echo 8. Connect to Azure SQL: %AZURE_SERVER%
echo 9. Execute the generated script
echo.
echo OR use the Export Data-tier Application (.bacpac) method:
echo.
echo 1. In SSMS, right-click %DATABASE_NAME%
echo 2. Tasks ^> Export Data-tier Application
echo 3. Save as .bacpac file
echo 4. Right-click Azure SQL Databases ^> Import Data-tier Application
echo 5. Select the .bacpac file
echo.

set /p USE_MANUAL="Have you completed the manual migration? (Y to skip, N to use automated method): "
if /i "%USE_MANUAL%"=="Y" (
    echo ✅ Manual migration completed
    goto :verify_data
)

echo.
echo ========================================================
echo   Automated Method: Using SqlPackage.exe
echo ========================================================
echo.

REM Check if SqlPackage is available
where sqlpackage >nul 2>&1
if errorlevel 1 (
    echo ⚠️  SqlPackage.exe not found in PATH
    echo.
    echo Please install SQL Server Data Tools (SSDT) or download SqlPackage:
    echo https://docs.microsoft.com/sql/tools/sqlpackage/sqlpackage-download
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

REM Export local database to BACPAC
echo 📦 Exporting local database to BACPAC...
echo This may take several minutes...
sqlpackage /Action:Export /SourceServerName:%LOCAL_SERVER% /SourceDatabaseName:%DATABASE_NAME% /SourceTrustServerCertificate:True /TargetFile:"%BACKUP_FILE%"

if errorlevel 1 (
    echo ❌ Export failed
    pause
    exit /b 1
)

echo ✅ Export completed: %BACKUP_FILE%
echo.

REM Import BACPAC to Azure SQL
echo 📤 Importing to Azure SQL Database...
echo This may take several minutes...
sqlpackage /Action:Import /SourceFile:"%BACKUP_FILE%" /TargetServerName:%AZURE_SERVER% /TargetDatabaseName:%DATABASE_NAME% /TargetUser:sqladmin /TargetPassword:%AZURE_PASSWORD% /TargetTrustServerCertificate:False

if errorlevel 1 (
    echo ❌ Import failed
    echo.
    echo Common issues:
    echo   - Incorrect password
    echo   - Firewall not allowing your IP
    echo   - Database already has data
    pause
    exit /b 1
)

echo ✅ Import completed successfully!
echo.

:verify_data
echo ========================================================
echo   ✅ Verifying Data Migration
echo ========================================================
echo.

echo 📊 Checking Azure SQL database contents...
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -Q "SELECT 'Companies:' as TableName, COUNT(*) as RecordCount FROM Companies UNION ALL SELECT 'Users:', COUNT(*) FROM Users UNION ALL SELECT 'Tickets:', COUNT(*) FROM Tickets UNION ALL SELECT 'Customers:', COUNT(*) FROM Customers UNION ALL SELECT 'Sites:', COUNT(*) FROM Sites" -W

echo.
echo 👥 Checking company data...
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -Q "SELECT CompanyCode, CompanyName, DisplayName, IsActive FROM Companies ORDER BY CompanyCode" -W

echo.
echo 🔑 Checking admin users...
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -Q "SELECT TOP 5 Username, FullName, Role, CompanyCode, IsActive FROM Users WHERE Role IN ('SystemAdmin', 'Admin') ORDER BY CompanyCode, Username" -W

echo.
echo ========================================================
echo   ✅ Migration Complete!
echo ========================================================
echo.
echo 📋 Connection String for your application:
echo.
echo Server=tcp:%AZURE_SERVER%,1433;Initial Catalog=%DATABASE_NAME%;User ID=sqladmin;Password=***;Encrypt=true;TrustServerCertificate=false;
echo.
echo 💡 Update your Azure App Service environment variables:
echo   DB_SERVER=%AZURE_SERVER%
echo   DB_NAME=%DATABASE_NAME%
echo   DB_USER=sqladmin
echo   DB_PASSWORD=***
echo   DB_ENCRYPT=true
echo.

REM Cleanup
if exist "%BACKUP_FILE%" (
    echo 🧹 Cleanup: Delete backup file? (Y/N)
    set /p DELETE_BACKUP=
    if /i "%DELETE_BACKUP%"=="Y" del "%BACKUP_FILE%"
)

echo.
echo 🎉 Ready to deploy your application!
echo    Run: deploy-azure-app.bat to deploy the web app
echo.
pause
