@echo off
setlocal EnableDelayedExpansion

:: Restore Database Script
:: Restores the Field Service database from a backup file

echo.
echo ==========================================
echo Field Service Database Restore
echo ==========================================
echo.

set "DB_NAME=FieldServiceDB"
set "SQL_INSTANCE=.\SQLEXPRESS"
set "BACKUP_DIR=C:\FieldServiceBackups"

:: Check if backup file was provided as parameter
if "%~1"=="" (
    echo Available backup files:
    echo.
    dir "%BACKUP_DIR%\*.bak" /b 2>nul
    if %errorLevel% neq 0 (
        echo No backup files found in %BACKUP_DIR%
        pause
        exit /b 1
    )
    echo.
    set /p BACKUP_FILE="Enter backup filename (or full path): "
    if "!BACKUP_FILE!"=="" (
        echo No backup file specified
        pause
        exit /b 1
    )
    
    :: Check if it's just a filename or full path
    if not exist "!BACKUP_FILE!" (
        set "BACKUP_FILE=%BACKUP_DIR%\!BACKUP_FILE!"
    )
) else (
    set "BACKUP_FILE=%~1"
)

echo Database: %DB_NAME%
echo Backup File: %BACKUP_FILE%
echo.

:: Verify backup file exists
if not exist "%BACKUP_FILE%" (
    echo ERROR: Backup file not found: %BACKUP_FILE%
    pause
    exit /b 1
)

:: Warning about data loss
echo WARNING: This will replace all current data in the database!
echo Current database will be backed up before restore.
echo.
choice /c YN /m "Do you want to continue with the restore"
if %errorLevel% neq 1 goto :cancel

:: Create backup of current database before restore
echo.
echo Creating backup of current database...
set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "CURRENT_BACKUP=%BACKUP_DIR%\FieldServiceDB_BeforeRestore_%TIMESTAMP%.bak"

sqlcmd -S "%SQL_INSTANCE%" -Q "BACKUP DATABASE [%DB_NAME%] TO DISK = '%CURRENT_BACKUP%' WITH COMPRESSION, INIT" >nul 2>&1
if %errorLevel% equ 0 (
    echo [√] Current database backed up to: %CURRENT_BACKUP%
) else (
    echo [!] Could not backup current database - continuing anyway
)

:: Set database to single user mode
echo.
echo Setting database to single user mode...
sqlcmd -S "%SQL_INSTANCE%" -Q "ALTER DATABASE [%DB_NAME%] SET SINGLE_USER WITH ROLLBACK IMMEDIATE"

:: Perform restore
echo Restoring database from backup...
sqlcmd -S "%SQL_INSTANCE%" -Q "RESTORE DATABASE [%DB_NAME%] FROM DISK = '%BACKUP_FILE%' WITH REPLACE"

if %errorLevel% equ 0 (
    echo [√] Database restored successfully
) else (
    echo [X] Database restore failed
    
    :: Try to restore from the backup we just made
    echo Attempting to restore from pre-restore backup...
    sqlcmd -S "%SQL_INSTANCE%" -Q "RESTORE DATABASE [%DB_NAME%] FROM DISK = '%CURRENT_BACKUP%' WITH REPLACE" >nul 2>&1
    
    echo Please check the backup file and try again
    pause
    exit /b 1
)

:: Set database back to multi user mode
echo Setting database back to multi user mode...
sqlcmd -S "%SQL_INSTANCE%" -Q "ALTER DATABASE [%DB_NAME%] SET MULTI_USER"

:: Verify restore
echo.
echo Verifying restored database...
sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -Q "
SELECT 
    'Customers' as TableName, COUNT(*) as RecordCount FROM Customers
UNION ALL
SELECT 
    'Sites' as TableName, COUNT(*) as RecordCount FROM Sites  
UNION ALL
SELECT 
    'Tickets' as TableName, COUNT(*) as RecordCount FROM Tickets
UNION ALL
SELECT 
    'Users' as TableName, COUNT(*) as RecordCount FROM Users
"

echo.
echo ==========================================
echo Database Restore Complete!
echo ==========================================
echo.
echo Database: %DB_NAME%
echo Restored from: %BACKUP_FILE%
echo Pre-restore backup: %CURRENT_BACKUP%
echo.
echo The application should now be ready to use.

goto :end

:cancel
echo Restore cancelled by user.
goto :end

:end
pause
exit /b 0