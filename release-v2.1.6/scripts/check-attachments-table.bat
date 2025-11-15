@echo off
REM Check if Attachments table exists and create it if needed

echo.
echo ============================================
echo Checking Attachments Table
echo ============================================
echo.

REM Load environment variables
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do set %%a=%%b
)

echo Checking if Attachments table exists in database: %DB_DATABASE%
echo.

sqlcmd -S %DB_SERVER% -d %DB_DATABASE% -E -Q "IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Attachments') PRINT 'Attachments table EXISTS' ELSE PRINT 'Attachments table DOES NOT EXIST'"

echo.
echo ============================================
echo.
echo Would you like to create the Attachments table now? (Y/N)
set /p CREATE_TABLE=

if /i "%CREATE_TABLE%"=="Y" (
    echo.
    echo Creating Attachments table...
    sqlcmd -S %DB_SERVER% -d %DB_DATABASE% -E -i database\create-attachments-table.sql
    echo.
    echo Done!
) else (
    echo.
    echo Skipped table creation.
)

echo.
pause
