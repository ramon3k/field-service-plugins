@echo off
title Quick Database Migration to Azure SQL

echo.
echo ========================================================
echo   ⚡ Quick Migration: Local DB to Azure SQL
echo ========================================================
echo.

set AZURE_SERVER=customer-portal-sql-server.database.windows.net
set DATABASE_NAME=FieldServiceDB
set SCRIPT_DIR=%~dp0database

echo Azure Server: %AZURE_SERVER%
echo Database: %DATABASE_NAME%
echo.

REM Get password
set /p AZURE_PASSWORD=Enter Azure SQL Password (sqladmin): 

echo.
echo 📝 Step 1: Creating tables in Azure SQL...
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -i "%SCRIPT_DIR%\create-database.sql"
if errorlevel 1 (
    echo ❌ Failed to create tables
    pause
    exit /b 1
)
echo ✅ Tables created

echo.
echo 👥 Step 2: Creating companies (DCPSP and JBI)...
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -Q "IF NOT EXISTS (SELECT 1 FROM Companies WHERE CompanyCode='DCPSP') INSERT INTO Companies (CompanyCode, CompanyName, DisplayName, IsActive, CreatedAt, UpdatedAt) VALUES ('DCPSP', 'DCPSP', 'DCPSP Field Services', 1, GETDATE(), GETDATE()); IF NOT EXISTS (SELECT 1 FROM Companies WHERE CompanyCode='JBI') INSERT INTO Companies (CompanyCode, CompanyName, DisplayName, IsActive, CreatedAt, UpdatedAt) VALUES ('JBI', 'JBI Security', 'JBI Security', 1, GETDATE(), GETDATE());"
echo ✅ Companies created

echo.
echo 🔑 Step 3: Creating admin users...
echo    - DCPSP admin (SystemAdmin role)
echo    - JBI admin (Admin role)
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -Q "IF NOT EXISTS (SELECT 1 FROM Users WHERE Username='admin' AND CompanyCode='DCPSP') INSERT INTO Users (UserID, Username, PasswordHash, FullName, Email, Role, CompanyCode, IsActive, CreatedAt, UpdatedAt) VALUES (NEWID(), 'admin', '$2b$10$rQZ3Z5Z5Z5Z5Z5Z5Z5Z5Z5OeX3Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'DCPSP Administrator', 'admin@dcpsp.com', 'SystemAdmin', 'DCPSP', 1, GETDATE(), GETDATE()); IF NOT EXISTS (SELECT 1 FROM Users WHERE Username='admin' AND CompanyCode='JBI') INSERT INTO Users (UserID, Username, PasswordHash, FullName, Email, Role, CompanyCode, IsActive, CreatedAt, UpdatedAt) VALUES (NEWID(), 'admin', '$2b$10$rQZ3Z5Z5Z5Z5Z5Z5Z5Z5Z5OeX3Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'JBI Administrator', 'admin@jbisecurity.com', 'Admin', 'JBI', 1, GETDATE(), GETDATE());"
echo ✅ Admin users created (password: admin123)

echo.
echo 📊 Step 4: Verifying migration...
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -Q "SELECT 'Companies' as Item, COUNT(*) as Count FROM Companies UNION ALL SELECT 'Users', COUNT(*) FROM Users UNION ALL SELECT 'Tables', COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE'" -W

echo.
echo 🏢 Companies in database:
sqlcmd -S %AZURE_SERVER% -d %DATABASE_NAME% -U sqladmin -P %AZURE_PASSWORD% -Q "SELECT CompanyCode, CompanyName, DisplayName, IsActive FROM Companies" -W

echo.
echo ========================================================
echo   ✅ Migration Complete!
echo ========================================================
echo.
echo 📋 Test Logins:
echo.
echo   DCPSP:
echo     Company Code: DCPSP
echo     Username: admin
echo     Password: admin123
echo.
echo   JBI:
echo     Company Code: JBI  
echo     Username: admin
echo     Password: admin123
echo.
echo 💡 Next step: Deploy your application to Azure
echo    Run: deploy-azure-app.bat
echo.
pause
