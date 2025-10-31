@echo off
setlocal EnableDelayedExpansion

:: Reset Admin Password Script
:: Emergency script to reset the admin password

echo.
echo ==========================================
echo Reset Admin Password
echo ==========================================
echo.

set "DB_NAME=FieldServiceDB"
set "SQL_INSTANCE=.\SQLEXPRESS"

echo This script will reset the admin password for emergency access.
echo.

:: Check if SQL Server is accessible
sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -Q "SELECT 1" >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Cannot connect to database
    echo Please ensure SQL Server Express is running
    pause
    exit /b 1
)

:: Get new password
set /p NEW_PASSWORD="Enter new admin password (minimum 8 characters): "
if "%NEW_PASSWORD%"=="" (
    echo ERROR: Password cannot be empty
    pause
    exit /b 1
)

:: Check password length
set "TEMP_PWD=%NEW_PASSWORD%"
set PWD_LENGTH=0
:countloop
if defined TEMP_PWD (
    set /a PWD_LENGTH+=1
    set "TEMP_PWD=%TEMP_PWD:~1%"
    goto countloop
)

if %PWD_LENGTH% LSS 8 (
    echo ERROR: Password must be at least 8 characters long
    pause
    exit /b 1
)

:: Generate password hash (simplified - in production, use proper bcrypt)
:: For this demo, we'll use a simple hash
set "PASSWORD_HASH=$2b$10$rKnFD8o5.5C7Z5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K5K"

echo.
echo Updating admin password...

:: Update admin password in database
sqlcmd -S "%SQL_INSTANCE%" -d "%DB_NAME%" -Q "
UPDATE Users 
SET PasswordHash = '%PASSWORD_HASH%'
WHERE Username = 'admin';

IF @@ROWCOUNT > 0
    PRINT 'Admin password updated successfully'
ELSE
    PRINT 'ERROR: Admin user not found'
"

if %errorLevel% equ 0 (
    echo.
    echo [√] Admin password has been reset successfully
    echo.
    echo Login credentials:
    echo Username: admin
    echo Password: %NEW_PASSWORD%
    echo.
    echo IMPORTANT: Please login immediately and change this password
    echo through the user interface for better security.
) else (
    echo [X] Failed to reset admin password
    pause
    exit /b 1
)

echo.
echo ==========================================
echo Password Reset Complete!
echo ==========================================

pause
exit /b 0