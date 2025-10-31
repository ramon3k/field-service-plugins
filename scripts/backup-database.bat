@echo off
setlocal EnableDelayedExpansion

:: Backup Database Script
:: Creates a full backup of the Field Service database

echo.
echo ==========================================
echo Field Service Database Backup
echo ==========================================
echo.

set "DB_NAME=FieldServiceDB"
set "SQL_INSTANCE=.\SQLEXPRESS"
set "BACKUP_DIR=C:\FieldServiceBackups"
set "TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_FILE=%BACKUP_DIR%\FieldServiceDB_%TIMESTAMP%.bak"

echo Database: %DB_NAME%
echo Backup Location: %BACKUP_FILE%
echo.

:: Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo Created backup directory: %BACKUP_DIR%
)

:: Perform database backup
echo Starting backup...
sqlcmd -S "%SQL_INSTANCE%" -Q "BACKUP DATABASE [%DB_NAME%] TO DISK = '%BACKUP_FILE%' WITH COMPRESSION, INIT"

if %errorLevel% equ 0 (
    echo [√] Backup completed successfully
    echo Backup file: %BACKUP_FILE%
    
    :: Get backup file size
    for %%A in ("%BACKUP_FILE%") do set "FILESIZE=%%~zA"
    set /a FILESIZE_MB=%FILESIZE%/1024/1024
    echo Backup size: %FILESIZE_MB% MB
    
) else (
    echo [X] Backup failed
    exit /b 1
)

:: Cleanup old backups (keep last 30 days)
echo.
echo Cleaning up old backups...
forfiles /p "%BACKUP_DIR%" /m "FieldServiceDB_*.bak" /d -30 /c "cmd /c del @path" 2>nul
echo Old backups cleaned up (kept last 30 days)

echo.
echo ==========================================
echo Backup Complete!
echo ==========================================

exit /b 0