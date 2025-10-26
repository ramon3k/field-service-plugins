@echo off
setlocal EnableDelayedExpansion

:: Database Creation Script for Field Service System
:: Creates the main application database and tenant registry

echo.
echo ==========================================
echo Creating Field Service Database
echo ==========================================
echo.

set "DB_NAME=FieldServiceDB"
set "TENANT_DB_NAME=TenantRegistry"
set "SQL_INSTANCE=.\SQLEXPRESS"
set "INSTALL_DIR=%~dp0.."

echo Database Instance: %SQL_INSTANCE%
echo Application Database: %DB_NAME%
echo Tenant Database: %TENANT_DB_NAME%
echo.

:: Check if SQL Server is running
echo Checking SQL Server status...
sc query "MSSQL$SQLEXPRESS" | find "RUNNING" >nul
if %errorLevel% neq 0 (
    echo Starting SQL Server Express...
    net start "MSSQL$SQLEXPRESS"
    timeout /t 10 /nobreak >nul
)

:: Test SQL Server connection
echo Testing SQL Server connection...
sqlcmd -S "%SQL_INSTANCE%" -Q "SELECT @@VERSION" >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Cannot connect to SQL Server instance: %SQL_INSTANCE%
    echo.
    echo Troubleshooting:
    echo 1. Verify SQL Server Express is installed
    echo 2. Check if the service is running
    echo 3. Verify TCP/IP is enabled
    echo.
    pause
    exit /b 1
)
echo [√] SQL Server connection successful

:: Create main application database
echo.
echo Creating application database: %DB_NAME%
sqlcmd -S "%SQL_INSTANCE%" -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '%DB_NAME%') CREATE DATABASE [%DB_NAME%]"
if %errorLevel% neq 0 (
    echo ERROR: Failed to create database %DB_NAME%
    pause
    exit /b 1
)
echo [√] Database %DB_NAME% created successfully

:: Run database schema script
echo.
echo Creating database schema...
if exist "%INSTALL_DIR%\database\create-database.sql" (
    sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -i "%INSTALL_DIR%\database\create-database.sql"
    if !errorLevel! equ 0 (
        echo [√] Database schema created successfully
    ) else (
        echo ERROR: Failed to create database schema
        echo Check the SQL script: %INSTALL_DIR%\database\create-database.sql
        pause
        exit /b 1
    )
) else (
    echo ERROR: Database schema file not found: %INSTALL_DIR%\database\create-database.sql
    pause
    exit /b 1
)

:: Create tenant registry database
echo.
echo Creating tenant registry database: %TENANT_DB_NAME%
sqlcmd -S "%SQL_INSTANCE%" -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '%TENANT_DB_NAME%') CREATE DATABASE [%TENANT_DB_NAME%]"
if %errorLevel% neq 0 (
    echo ERROR: Failed to create tenant database %TENANT_DB_NAME%
    pause
    exit /b 1
)
echo [√] Tenant database %TENANT_DB_NAME% created successfully

:: Run tenant registry schema script
echo.
echo Creating tenant registry schema...
if exist "%INSTALL_DIR%\server\create-tenant-registry.sql" (
    sqlcmd -S "%SQL_INSTANCE%" -d "%TENANT_DB_NAME%" -i "%INSTALL_DIR%\server\create-tenant-registry.sql"
    if !errorLevel! equ 0 (
        echo [√] Tenant registry schema created successfully
    ) else (
        echo WARNING: Tenant registry creation had issues - continuing anyway
    )
) else (
    echo WARNING: Tenant registry schema file not found - skipping
)

:: Create default admin user
echo.
echo Creating default admin user...
sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -Q "
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (ID, Username, Email, FullName, Role, PasswordHash, IsActive, CreatedAt)
    VALUES ('admin_001', 'admin', 'admin@company.com', 'System Administrator', 'Admin', '$2b$10$rKnFD8o5.5C7Z5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K', 1, GETDATE())
    PRINT 'Default admin user created'
END
ELSE
    PRINT 'Default admin user already exists'
"

if %errorLevel% equ 0 (
    echo [√] Default admin user configured
) else (
    echo WARNING: Could not create default admin user - may need manual setup
)

:: Set up database backup
echo.
echo Configuring database backup...
sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -Q "
EXEC sp_addumpdevice 'disk', 'FieldServiceDB_Backup', 'C:\FieldServiceBackups\FieldServiceDB.bak'
" >nul 2>&1

:: Create initial backup
echo Creating initial backup...
if not exist "C:\FieldServiceBackups" mkdir "C:\FieldServiceBackups"
sqlcmd -S "%SQL_INSTANCE%" -Q "BACKUP DATABASE [%DB_NAME%] TO DISK = 'C:\FieldServiceBackups\FieldServiceDB_Initial.bak' WITH INIT"
if %errorLevel% equ 0 (
    echo [√] Initial backup created: C:\FieldServiceBackups\FieldServiceDB_Initial.bak
) else (
    echo WARNING: Could not create initial backup
)

:: Verify database tables
echo.
echo Verifying database installation...
sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -Q "
SELECT 
    COUNT(*) as TableCount,
    (SELECT COUNT(*) FROM Users) as UserCount,
    (SELECT COUNT(*) FROM Customers) as CustomerCount
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
" -h -1 -s "," | findstr /r "[0-9]"

echo.
echo ==========================================
echo Database Setup Complete!
echo ==========================================
echo.
echo Database Server: %SQL_INSTANCE%
echo Database Name: %DB_NAME%
echo Backup Location: C:\FieldServiceBackups\
echo.
echo Default Login:
echo Username: admin
echo Password: admin123
echo.
echo Note: Change the default password after first login!

exit /b 0